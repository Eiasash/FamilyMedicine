// Editorial Clinical 2026-04 — Underline tab indicator.
//
// wireUnderlineTabs(container) installs a single `.tab-indicator` element
// inside the given container (the existing tab bar element) and keeps its
// width + translateX in sync with the currently-active tab.
//
// Activation rule: a child element with class `.on` (or `[aria-selected="true"]`)
// is considered the active tab. The host app already toggles `.on` whenever
// it re-renders the tab bar — see `renderTabs()` in src/ui/app.js.
//
// RTL note: `transform: translateX(<px>)` on a flex container with logical
// `inset-inline-start: 0` works in both LTR and RTL. We measure the tab's
// position relative to the container's content-box using getBoundingClientRect
// so the offset is always the visual leading edge in either direction.
//
// Resilient to:
//   - dynamic re-renders (MutationObserver on the container's child list)
//   - layout changes (ResizeObserver on the container)
//   - viewport changes (window resize)
//   - reduced-motion (CSS handles the timing — we just set width/transform)

export function wireUnderlineTabs(container) {
  if (!container || !(container instanceof HTMLElement)) return null;

  // Idempotent: bail out if we already wired this container.
  if (container.dataset.indicatorWired === 'true') return container.__tabIndicator || null;

  // Position context for the absolutely-positioned indicator.
  // Bottom-fixed tab bars are already position:fixed, which is a positioning
  // context. Top horizontal tab bars (`.tabs`) are position:relative via
  // layout-primitives.css. Either way we don't need to mutate it here.

  let indicator = container.querySelector(':scope > .tab-indicator');
  if (!indicator) {
    indicator = document.createElement('span');
    indicator.className = 'tab-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    container.appendChild(indicator);
  }

  container.dataset.indicatorWired = 'true';
  container.__tabIndicator = indicator;

  function findActive() {
    return (
      container.querySelector(':scope > .on') ||
      container.querySelector(':scope > [aria-selected="true"]') ||
      container.querySelector(':scope > .is-active') ||
      null
    );
  }

  function update() {
    const active = findActive();
    if (!active) {
      indicator.style.opacity = '0';
      return;
    }
    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();
    // Compute leading-edge offset accounting for current scroll inside the
    // container (tab bars are horizontally scrollable on narrow screens).
    const offset = aRect.left - cRect.left + container.scrollLeft;
    indicator.style.opacity = '1';
    indicator.style.width = `${aRect.width}px`;
    indicator.style.transform = `translateX(${offset}px)`;
  }

  // Observe DOM mutations (re-renders may swap the .on tab).
  let mo;
  try {
    mo = new MutationObserver(() => {
      // Defer to next frame so layout settles after innerHTML swaps.
      requestAnimationFrame(update);
    });
    mo.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'aria-selected'],
    });
  } catch (_) {
    // jsdom or older browsers: fall back to event-driven updates only.
  }

  // Observe size changes (e.g. orientation, font-load reflow).
  let ro;
  try {
    ro = new ResizeObserver(() => requestAnimationFrame(update));
    ro.observe(container);
  } catch (_) {
    /* no-op */
  }

  // Window resize as a final safety net.
  const onResize = () => requestAnimationFrame(update);
  window.addEventListener('resize', onResize, { passive: true });

  // Click also drives an immediate update so the indicator slides before the
  // app's render cycle catches up.
  const onClick = () => requestAnimationFrame(update);
  container.addEventListener('click', onClick);

  // Initial paint — wait one frame so .on class is applied + fonts have loaded.
  requestAnimationFrame(update);
  // Second paint after font-load (Frank Ruhl Libre / Heebo can shift widths).
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => requestAnimationFrame(update)).catch(() => {});
  }

  return {
    update,
    destroy() {
      try { mo && mo.disconnect(); } catch (_) {}
      try { ro && ro.disconnect(); } catch (_) {}
      window.removeEventListener('resize', onResize);
      container.removeEventListener('click', onClick);
      delete container.dataset.indicatorWired;
      delete container.__tabIndicator;
      if (indicator && indicator.parentNode === container) container.removeChild(indicator);
    },
  };
}

export default wireUnderlineTabs;
