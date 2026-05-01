#!/usr/bin/env bash
# verify-deploy.sh — Post-deploy live verification.
#
# Curls the live GitHub Pages URLs and confirms the expected version string
# appears in the deployed bundled JS and sw.js. Polls with backoff because
# Pages takes ~60–90s to publish after push.
#
# Why: existing scripts/verify-dist-sw.cjs validates LOCAL dist/ files match.
# This validates the LIVE site actually shipped the new version — catches
# the "cache masking shipped fixes" + "Pages build silently failed" cases.
#
# Note: Mishpacha uses Vite, so APP_VERSION is bundled into a hashed asset
# (assets/mishpacha-mega-<hash>.js). The script extracts the bundle URL from
# the live HTML, then greps the bundle for BUILD_HASH's `q-vX.Y.Z` suffix —
# a stable per-release marker (older versions like 1.21.1 also appear in the
# CHANGELOG strings, so we can't just grep for the bare "X.Y.Z" literal).
#
# Usage:
#   ./scripts/verify-deploy.sh                # uses package.json version
#   ./scripts/verify-deploy.sh 1.21.2         # explicit version
#   ./scripts/verify-deploy.sh --wait 180     # max wait seconds (default 120)
#   ./scripts/verify-deploy.sh --no-wait      # one-shot check, no polling
#
# Exit codes:
#   0 — both bundle and sw.js show the expected version
#   1 — version mismatch after wait window
#   2 — usage error or network failure

set -u

LIVE_HTML='https://eiasash.github.io/FamilyMedicine/mishpacha-mega.html'
LIVE_SW='https://eiasash.github.io/FamilyMedicine/sw.js'
LIVE_BASE='https://eiasash.github.io/FamilyMedicine'
WAIT_MAX=120
INTERVAL=10
ONESHOT=0
VERSION=''

while [[ $# -gt 0 ]]; do
  case "$1" in
    --wait) WAIT_MAX="$2"; shift 2;;
    --no-wait) ONESHOT=1; shift;;
    -h|--help) sed -n '1,30p' "$0"; exit 0;;
    -*) echo "verify-deploy: unknown flag $1" >&2; exit 2;;
    *) VERSION="$1"; shift;;
  esac
done

if [[ -z "$VERSION" ]]; then
  if ! VERSION=$(node -p "require('./package.json').version" 2>/dev/null); then
    echo "verify-deploy: cannot read package.json version" >&2
    exit 2
  fi
fi

echo "verify-deploy: expecting v${VERSION}"
echo "  HTML: ${LIVE_HTML}"
echo "  SW:   ${LIVE_SW}"

start=$(date +%s)
while true; do
  bundle_ok=0
  sw_ok=0

  html_body=$(curl -sf -A 'Mozilla/5.0 verify-deploy' --max-time 15 "${LIVE_HTML}" || true)
  sw_body=$(curl -sf -A 'Mozilla/5.0 verify-deploy' --max-time 15 "${LIVE_SW}" || true)

  # Extract the hashed bundle URL from the HTML (e.g. assets/mishpacha-mega-Crq9KF5L.js)
  bundle_path=$(printf '%s' "$html_body" | grep -oE 'assets/mishpacha-mega-[A-Za-z0-9_-]+\.js' | head -n 1)
  if [[ -n "$bundle_path" ]]; then
    bundle_body=$(curl -sf -A 'Mozilla/5.0 verify-deploy' --max-time 30 "${LIVE_BASE}/${bundle_path}" || true)
    # BUILD_HASH lives in src/core/constants.js as `<Nq>-vX.Y.Z`; the `q-vX.Y.Z`
    # suffix is what uniquely tracks a release (CHANGELOG also embeds bare versions).
    if printf '%s' "$bundle_body" | grep -qF "q-v${VERSION}"; then
      bundle_ok=1
    fi
  fi

  if printf '%s' "$sw_body" | grep -qF "mishpacha-v${VERSION}"; then
    sw_ok=1
  fi

  if [[ "$bundle_ok" = 1 && "$sw_ok" = 1 ]]; then
    elapsed=$(( $(date +%s) - start ))
    echo "  BUNDLE BUILD_HASH=q-v${VERSION}     PASS (${bundle_path})"
    echo "  SW     CACHE=mishpacha-v${VERSION}  PASS"
    echo "verify-deploy: PASS (after ${elapsed}s)"
    exit 0
  fi

  elapsed=$(( $(date +%s) - start ))
  if [[ "$ONESHOT" = 1 ]] || (( elapsed >= WAIT_MAX )); then
    echo ""
    echo "verify-deploy: FAIL after ${elapsed}s"
    [[ -z "$bundle_path" ]] && echo "  ✗ could not locate assets/mishpacha-mega-*.js in live HTML"
    [[ -n "$bundle_path" && "$bundle_ok" = 0 ]] && echo "  ✗ live bundle ${bundle_path} missing 'q-v${VERSION}' (BUILD_HASH suffix)"
    [[ "$sw_ok" = 0 ]] && echo "  ✗ live sw.js missing 'mishpacha-v${VERSION}'"
    echo ""
    echo "Possible causes:"
    echo "  - GitHub Pages still building — wait 30s, retry"
    echo "  - Push didn't land on main"
    echo "  - Trinity drift — check src/core/constants.js APP_VERSION + BUILD_HASH + sw.js CACHE + package.json"
    echo "  - CDN cache — try cache-busted URL: ${LIVE_HTML}?v=${VERSION}"
    exit 1
  fi

  echo "  ...polling (bundle=${bundle_ok} sw=${sw_ok}, ${elapsed}s/${WAIT_MAX}s) — sleeping ${INTERVAL}s"
  sleep "$INTERVAL"
done
