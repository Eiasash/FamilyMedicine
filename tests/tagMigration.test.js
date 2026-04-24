/**
 * Tests for src/core/tagMigration.js.
 *
 * Locks the six invariants documented in the module-level comment:
 *   1. Rename applies to MAP keys only; other strings untouched.
 *   2. Walk reaches nested arrays and objects.
 *   3. Sentinel (__tagMigrationV2) is set on the top-level plain-object
 *      state so repeat runs are a no-op.
 *   4. Already-migrated state (sentinel present) is returned unchanged.
 *   5. Non-object input (null / primitive / array) is returned as-is and
 *      the sentinel is NOT added.
 *   6. Corrupt JSON in storage is swallowed by migrateStoredTags and the
 *      key is left untouched; a bad parse never throws.
 */

import { describe, it, expect } from 'vitest';
import {
  migrateTags,
  migrateStoredTags,
  TAG_MIGRATION_MAP,
  TAG_MIGRATION_SENTINEL,
} from '../src/core/tagMigration.js';

// ---- helpers ----------------------------------------------------------------

function makeStorage(initial = {}) {
  const store = { ...initial };
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    _store: store,
  };
}

// ---- TAG_MIGRATION_MAP contract ---------------------------------------------

describe('TAG_MIGRATION_MAP', () => {
  it('maps every legacy short-form to a canonical YYYY-Mon token', () => {
    expect(TAG_MIGRATION_MAP['Jun21']).toBe('2021-Jun');
    expect(TAG_MIGRATION_MAP['Jun22']).toBe('2022-Jun');
    expect(TAG_MIGRATION_MAP['Jun23']).toBe('2023-Jun');
    expect(TAG_MIGRATION_MAP['May24']).toBe('2024-May');
    expect(TAG_MIGRATION_MAP['Oct24']).toBe('2024-Sep');
    expect(TAG_MIGRATION_MAP['2024-Oct']).toBe('2024-Sep');
    expect(TAG_MIGRATION_MAP['Jun25']).toBe('2025-Jun');
  });

  it('is frozen (immutable)', () => {
    expect(Object.isFrozen(TAG_MIGRATION_MAP)).toBe(true);
  });
});

// ---- migrateTags — invariant 1: renames MAP keys only ----------------------

describe('migrateTags — invariant 1: renames MAP keys, leaves others untouched', () => {
  it('renames a top-level string value that is a MAP key', () => {
    const state = { years: ['Jun21', '2022-Jun'] };
    migrateTags(state);
    expect(state.years[0]).toBe('2021-Jun');
    expect(state.years[1]).toBe('2022-Jun'); // already canonical
  });

  it('does not rename strings that are not in the MAP', () => {
    const state = { tag: '2020', other: 'Nelson' };
    migrateTags(state);
    expect(state.tag).toBe('2020');
    expect(state.other).toBe('Nelson');
  });

  it('renames both old forms of the Sep-24 session', () => {
    const state = { a: 'Oct24', b: '2024-Oct' };
    migrateTags(state);
    expect(state.a).toBe('2024-Sep');
    expect(state.b).toBe('2024-Sep');
  });
});

// ---- migrateTags — invariant 2: walk reaches nested structures -------------

describe('migrateTags — invariant 2: walk reaches nested arrays and objects', () => {
  it('renames strings inside nested objects', () => {
    const state = { filters: { year: 'Jun22' } };
    migrateTags(state);
    expect(state.filters.year).toBe('2022-Jun');
  });

  it('renames strings inside nested arrays', () => {
    const state = { history: [['Jun25', 'Nelson'], 'May24'] };
    migrateTags(state);
    expect(state.history[0][0]).toBe('2025-Jun');
    expect(state.history[1]).toBe('2024-May');
  });

  it('renames strings deeply nested several levels', () => {
    const state = { a: { b: { c: { d: 'Jun23' } } } };
    migrateTags(state);
    expect(state.a.b.c.d).toBe('2023-Jun');
  });

  it('handles mixed arrays with objects', () => {
    const state = { sessions: [{ tag: 'Jun21' }, { tag: '2022-Jun' }] };
    migrateTags(state);
    expect(state.sessions[0].tag).toBe('2021-Jun');
    expect(state.sessions[1].tag).toBe('2022-Jun');
  });
});

// ---- migrateTags — invariant 3: sentinel is set after migration -------------

describe('migrateTags — invariant 3: sentinel set on plain-object input', () => {
  it('adds sentinel to the top-level object', () => {
    const state = { x: 1 };
    migrateTags(state);
    expect(state[TAG_MIGRATION_SENTINEL]).toBe(true);
  });

  it('does NOT add sentinel to an array (arrays are passed through)', () => {
    const arr = ['Jun21', 'Jun22'];
    migrateTags(arr);
    expect(arr[TAG_MIGRATION_SENTINEL]).toBeUndefined();
  });
});

// ---- migrateTags — invariant 4: idempotency --------------------------------

describe('migrateTags — invariant 4: already-migrated state is returned unchanged', () => {
  it('short-circuits on second call without re-walking', () => {
    const state = { tag: 'Jun21' };
    migrateTags(state); // first pass — renames
    expect(state.tag).toBe('2021-Jun');

    // Manually put a legacy tag back (simulates a second write before migration)
    state.tag = 'Jun22';
    migrateTags(state); // second pass — sentinel present → no-op
    expect(state.tag).toBe('Jun22'); // NOT renamed — sentinel blocked re-walk
  });

  it('returns the same object reference', () => {
    const state = { a: 1 };
    const result = migrateTags(state);
    expect(result).toBe(state);
  });
});

// ---- migrateTags — invariant 5: non-object / array input returned as-is ---

describe('migrateTags — invariant 5: non-object input is returned as-is', () => {
  it('returns null unchanged', () => {
    expect(migrateTags(null)).toBeNull();
  });

  it('returns a string unchanged', () => {
    expect(migrateTags('Jun21')).toBe('Jun21');
  });

  it('returns a number unchanged', () => {
    expect(migrateTags(42)).toBe(42);
  });

  it('returns an array without adding sentinel', () => {
    const arr = ['Jun21'];
    const result = migrateTags(arr);
    expect(result).toBe(arr);
    // Arrays get their values renamed by walk, but sentinel NOT added at top level.
    // (Walk still processes the contents when called internally, but at top-level
    //  the sentinel guard returns early for arrays too.)
    expect(Object.prototype.hasOwnProperty.call(arr, TAG_MIGRATION_SENTINEL)).toBe(false);
  });
});

// ---- migrateStoredTags — invariant 6: corrupt JSON is swallowed -----------

describe('migrateStoredTags — invariant 6: corrupt JSON is swallowed', () => {
  it('does not throw when storage returns corrupt JSON', () => {
    const storage = makeStorage({ 'mishpacha_mega': '{BROKEN JSON' });
    expect(() => migrateStoredTags('mishpacha_mega', storage)).not.toThrow();
  });

  it('does not throw when storage is null/undefined', () => {
    expect(() => migrateStoredTags('mishpacha_mega', null)).not.toThrow();
    expect(() => migrateStoredTags('mishpacha_mega', undefined)).not.toThrow();
  });

  it('does nothing when key is absent from storage', () => {
    const storage = makeStorage({});
    migrateStoredTags('mishpacha_mega', storage);
    expect(storage.getItem('mishpacha_mega')).toBeNull();
  });
});

// ---- migrateStoredTags — round-trip writes back migrated state ------------

describe('migrateStoredTags — round-trip', () => {
  it('reads, migrates, and writes back canonical tags', () => {
    const raw = JSON.stringify({ years: ['Jun21', '2021-Jun'] });
    const storage = makeStorage({ 'mishpacha_mega': raw });

    migrateStoredTags('mishpacha_mega', storage);

    const updated = JSON.parse(storage.getItem('mishpacha_mega'));
    expect(updated.years[0]).toBe('2021-Jun');
    expect(updated.years[1]).toBe('2021-Jun');
    expect(updated[TAG_MIGRATION_SENTINEL]).toBe(true);
  });

  it('is a no-op when sentinel is already present in storage', () => {
    const state = { years: ['Jun22'], [TAG_MIGRATION_SENTINEL]: true };
    const raw = JSON.stringify(state);
    const storage = makeStorage({ 'mishpacha_mega': raw });

    migrateStoredTags('mishpacha_mega', storage);

    const stored = JSON.parse(storage.getItem('mishpacha_mega'));
    // years[0] should NOT have been renamed since sentinel blocked walk
    expect(stored.years[0]).toBe('Jun22');
  });
});
