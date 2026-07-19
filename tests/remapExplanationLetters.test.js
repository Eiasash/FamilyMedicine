/**
 * v1.21.8 regression: remapExplanationLetters must remap option-letter
 * references in explanations after option shuffle, including BARE LABEL
 * forms like "א' שגויה" / "ב' נכונה".
 *
 * Bug found in Geri (v10.64.22), ported here since FM uses the same
 * function in src/core/utils.js.
 */
import { describe, it, expect } from "vitest";
import { remapExplanationLetters } from "../src/core/utils.js";

describe("remapExplanationLetters — v1.21.8 fix", () => {
  const identity = [0, 1, 2, 3];

  it("identity shuffle leaves text unchanged", () => {
    const text = "התשובה הנכונה היא ב'. א' שגויה. Answer C.";
    expect(remapExplanationLetters(text, identity)).toBe(text);
  });

  it("does not remap mid-word gershayim like \"מג'ורי\" (Major)", () => {
    const swap = [1, 0, 2, 3];
    const text = "מאופיין על ידי דיכאון מג'ורי (Major Depression)";
    expect(remapExplanationLetters(text, swap)).toBe(text);
  });

  it("does not remap foreign-sound-at-word-start \"ג'נטיקה\" (genetics)", () => {
    const swap = [1, 0, 2, 3];
    const text = "ג'נטיקה היא חשובה";
    expect(remapExplanationLetters(text, swap)).toBe(text);
  });

  it("remaps \"תשובה ב'\" form when option shuffled", () => {
    const shuf = [3, 2, 0, 1];
    const text = "האפשרות הנכונה היא תשובה ב'.";
    expect(remapExplanationLetters(text, shuf)).toContain("תשובה ד'");
  });

  it("remaps bare \"א' שגויה\" label form when option shuffled", () => {
    const shuf = [3, 2, 0, 1];
    const text = "- **א' שגויה** — option-1\n- **ד' שגויה** — option-4";
    const result = remapExplanationLetters(text, shuf);
    expect(result).toContain("ג' שגויה");
    expect(result).toContain("א' שגויה");
  });

  it("remaps Latin standalone letters", () => {
    const shuf = [2, 0, 1, 3];
    expect(remapExplanationLetters("The answer is A.", shuf)).toBe("The answer is B.");
    expect(remapExplanationLetters("Choice B is correct.", shuf)).toBe("Choice C is correct.");
  });

  it("does not double-remap a letter in alternated patterns", () => {
    const swap = [1, 0, 2, 3];
    expect(remapExplanationLetters("תשובה ב' היא הנכונה", swap)).toBe("תשובה א' היא הנכונה");
  });
});


/**
 * G5 (2026-07-18): the unguarded bare-Latin /\b([A-E])\b/ remap corrupted
 * medical tokens (vitamin D, hepatitis B, part A/B, class/type A, grade A-C,
 * SARC-F "**C**", 37 degC/degF) whenever the deterministic option shuffle moved
 * that index. The Latin remap is now ANCHORED to an explicit option keyword
 * (answer/option/choice). Bare Latin letters with no anchor are HELD.
 */
describe("remapExplanationLetters — G5 anchored Latin + medical-token HOLD", () => {
  // A shuffle that moves every A-E index, so any accidental remap would show.
  const shuf = [3, 2, 1, 0];

  // --- positive: keyword-anchored Latin refs STILL remap ---
  it("remaps keyword-anchored Latin refs (answer/option/choice)", () => {
    const s = [2, 0, 1, 3]; // A->B, B->C, C->A
    expect(remapExplanationLetters("answer A", s)).toBe("answer B");
    expect(remapExplanationLetters("option C", s)).toBe("option A");
    expect(remapExplanationLetters("choice B", s)).toBe("choice C");
    expect(remapExplanationLetters("The answer is A.", s)).toBe("The answer is B.");
    expect(remapExplanationLetters("(answer B)", s)).toBe("(answer C)");
  });

  // --- negative: bare Latin medical tokens are HELD unchanged ---
  it("holds 'vitamin D' (bare letter, no keyword)", () => {
    expect(remapExplanationLetters("Vitamin D deficiency", shuf)).toBe("Vitamin D deficiency");
  });
  it("holds 'hepatitis B' / 'hepatitis A'", () => {
    expect(remapExplanationLetters("hepatitis B vaccine, hepatitis A too", shuf))
      .toBe("hepatitis B vaccine, hepatitis A too");
  });
  it("holds 'type A' / 'type B' / 'class A'", () => {
    expect(remapExplanationLetters("type A and type B; class A drug", shuf))
      .toBe("type A and type B; class A drug");
  });
  it("holds 'part A and part B' and 'grade A-C'", () => {
    expect(remapExplanationLetters("part A and part B, grade A-C", shuf))
      .toBe("part A and part B, grade A-C");
  });
  it("holds degree tokens '37 C'/'38 C' (degC/degF context)", () => {
    expect(remapExplanationLetters("fever 38 C then 37 C", shuf))
      .toBe("fever 38 C then 37 C");
  });
  it("holds SARC-F bold letter '**C**'", () => {
    expect(remapExplanationLetters("SARC-F: **C** = Climbing stairs", shuf))
      .toBe("SARC-F: **C** = Climbing stairs");
  });
  it("holds a bare sentence-initial Latin letter with no anchor", () => {
    expect(remapExplanationLetters("B is the correct pattern here", shuf))
      .toBe("B is the correct pattern here");
  });

  // --- mixed: anchored ref remaps, adjacent medical token held ---
  it("remaps the anchored ref but HOLDS the medical token in the same string", () => {
    const s = [2, 0, 1, 3]; // A->B
    expect(remapExplanationLetters("The answer is A. Vitamin B is unrelated.", s))
      .toBe("The answer is B. Vitamin B is unrelated.");
  });

  // --- guard: identity shuffle never changes medical tokens ---
  it("identity shuffle leaves medical tokens untouched", () => {
    const id = [0, 1, 2, 3, 4];
    const t = "Vitamin D, hepatitis B, type A, grade C, 37 C, **C**";
    expect(remapExplanationLetters(t, id)).toBe(t);
  });
});
