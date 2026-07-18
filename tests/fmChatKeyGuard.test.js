// @vitest-environment jsdom
/**
 * FM-2 (2026-07-15): a proxy 401/403 in sendChat() must NOT delete the user's
 * personal Anthropic key (mishpacha_apikey).
 *
 * After the JWT cutover, a proxy 401/403 is about the Supabase JWT minted by
 * getProxyBearer(), NOT the personal key. The old code ran
 * `localStorage.removeItem('mishpacha_apikey')` on 401/403, blacking out every
 * subsequent callAI() (which falls back to the personal key) after a single
 * transient chat failure.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// getProxyBearer() talks to Supabase — stub it so we control the token and can
// drive fetch to a 401/403 with no network. Isolate the rest of more-view's
// heavy import graph so this exercises sendChat() alone.
vi.mock('../src/services/supabaseAuth.js', () => ({
  getProxyBearer: vi.fn(async () => 'Bearer test.jwt.token'),
}));
vi.mock('../src/ai/client.js', () => ({ callAI: vi.fn() }));
vi.mock('../src/features/cloud.js', () => ({ submitFeedbackForm: vi.fn() }));
vi.mock('../src/features/auth.js', () => ({ bindAuthEvents: vi.fn() }));
vi.mock('../src/features/study_plan/index.js', () => ({ bindStudyPlanEvents: vi.fn() }));
vi.mock('../src/quiz/modes.js', () => ({ startVoiceParser: vi.fn() }));
vi.mock('../src/sr/spaced-repetition.js', () => ({ srScore: vi.fn() }));
vi.mock('../src/quiz/wrong-review.js', () => ({ markWrong: vi.fn() }));

import G from '../src/core/globals.js';
import { sendChat } from '../src/ui/more-view.js';

describe('FM-2: sendChat does not wipe mishpacha_apikey on a proxy 401/403', () => {
  beforeEach(() => {
    document.body.innerHTML =
      '<textarea id="chat-input"></textarea><div id="chat-msgs"></div>';
    localStorage.clear();
    localStorage.setItem('mishpacha_apikey', 'sk-ant-personal-key');
    G.S = { chat: [] };
    G.chatLoading = false;
    G.save = vi.fn();
    G.render = vi.fn();
  });

  it('a 401 leaves the key intact and still surfaces a service error', async () => {
    document.getElementById('chat-input').value = 'מה יעדי לחץ הדם?';
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));

    await sendChat();

    // Core regression: the personal key callAI() relies on must survive.
    expect(localStorage.getItem('mishpacha_apikey')).toBe('sk-ant-personal-key');
    // The failure is still surfaced to the user as a chat error bubble.
    const last = G.S.chat[G.S.chat.length - 1];
    expect(last.role).toBe('error');
  });

  it('a 403 also leaves the key intact', async () => {
    document.getElementById('chat-input').value = 'שאלה נוספת';
    globalThis.fetch = vi.fn(async () => ({ ok: false, status: 403, json: async () => ({}) }));

    await sendChat();

    expect(localStorage.getItem('mishpacha_apikey')).toBe('sk-ant-personal-key');
  });
});
