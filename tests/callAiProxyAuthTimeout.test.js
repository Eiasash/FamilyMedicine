/**
 * IM-7 (2026-07-18): callAI() must not hang if getProxyBearer() hangs.
 *
 * The per-call AbortController only covers the proxy fetch. getProxyBearer()
 * (Supabase getSession/signInAnonymously + dynamic https CDN import) is now raced
 * against an 8s reject, so a hung sign-in / CDN import rejects and callAI falls
 * through to its existing personal-API-key fallback. The happy path (proxy 200) is
 * unchanged.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('../src/services/supabaseAuth.js', () => ({
  getProxyBearer: vi.fn(),
}));
vi.mock('../src/core/utils.js', () => ({
  getApiKey: vi.fn(),
}));

import { callAI } from '../src/ai/client.js';
import { getProxyBearer } from '../src/services/supabaseAuth.js';
import { getApiKey } from '../src/core/utils.js';

const NEVER = () => new Promise(() => {}); // never settles

beforeEach(() => {
  getProxyBearer.mockReset();
  getApiKey.mockReset();
  globalThis.fetch = vi.fn();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('IM-7: callAI races getProxyBearer against an 8s timeout', () => {
  it('a never-resolving getProxyBearer rejects within ~8s and reaches the fallback (no key -> no_key)', async () => {
    vi.useFakeTimers();
    getProxyBearer.mockImplementation(NEVER);
    getApiKey.mockReturnValue(null); // no personal key -> fallback throws no_key

    const p = callAI([{ role: 'user', content: 'hi' }]);
    p.catch(() => {}); // pre-attach so no unhandled rejection while timers advance
    await vi.advanceTimersByTimeAsync(8000); // fire the auth timeout

    await expect(p).rejects.toThrow('no_key');
    // Proxy fetch was never reached (auth never resolved) and we DID fall through.
    expect(globalThis.fetch).not.toHaveBeenCalled();
    expect(getApiKey).toHaveBeenCalled();
  });

  it('a never-resolving getProxyBearer falls through to the personal API key when present', async () => {
    vi.useFakeTimers();
    getProxyBearer.mockImplementation(NEVER);
    getApiKey.mockReturnValue('sk-ant-personal');
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ text: 'from personal key' }] }),
    }));

    const p = callAI([{ role: 'user', content: 'hi' }]);
    p.catch(() => {});
    await vi.advanceTimersByTimeAsync(8000);

    await expect(p).resolves.toBe('from personal key');
    // Exactly one fetch — the direct Anthropic API; the proxy was skipped.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(String(globalThis.fetch.mock.calls[0][0])).toContain('api.anthropic.com');
  });

  it('happy path: proxy 200 returns its text unchanged (auth resolves fast)', async () => {
    getProxyBearer.mockResolvedValue('Bearer good.jwt');
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({ content: [{ text: 'proxy answer' }] }),
    }));

    const out = await callAI([{ role: 'user', content: 'hi' }]);
    expect(out).toBe('proxy answer');
    expect(getProxyBearer).toHaveBeenCalledTimes(1);
    // The single fetch hit the proxy, not the direct API.
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(String(globalThis.fetch.mock.calls[0][0])).toContain('/api/claude');
    // No personal-key fallback on the happy path.
    expect(getApiKey).not.toHaveBeenCalled();
  });
});
