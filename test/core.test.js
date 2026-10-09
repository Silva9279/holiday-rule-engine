/**
 * Tests for the Holiday Rule Engine.
 *
 * Node's built-in test runner (node --test) is used. All dates are
 * constructed explicitly with local-time constructors; we never read the
 * wall clock. Comparisons use getFullYear/getMonth/getDate so the tests
 * are robust to the host's timezone.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { Engine, NthWeekday, NearestWeekday, FixedDate } from '../src/index.js';

/**
 * Helper: format a Date as YYYY-MM-DD for readable failure messages.
 * Not used for assertions.
 */
function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function assertDate(actual, expectedY, expectedM, expectedD) {
  assert.equal(actual.getFullYear(), expectedY, `year: ${fmt(actual)}`);
  assert.equal(actual.getMonth(), expectedM, `month: ${fmt(actual)}`);
  assert.equal(actual.getDate(), expectedD, `day: ${fmt(actual)}`);
}

test('NthWeekday: US Thanksgiving 2024 (fourth Thursday of November)', () => {
  const rule = new NthWeekday({ year: 2024, month: 11, weekday: 'thursday', n: 4 });
  assertDate(rule.resolve(2024), 2024, 10, 28);
});

test('NthWeekday: US Labor Day 2025 (first Monday of September)', () => {
  const rule = new NthWeekday({ year: 2025, month: 9, weekday: 'monday', n: 1 });
  assertDate(rule.resolve(2025), 2025, 8, 1);
});

test('NthWeekday: last Monday of May 2025 (Memorial Day)', () => {
  const rule = new NthWeekday({ year: 2025, month: 5, weekday: 'monday', n: -1 });
  assertDate(rule.resolve(2025), 2025, 4, 26);
});

test('NthWeekday: month starting on the target weekday yields the 1st as first', () => {
  // September 2025: 1 Sept is a Monday.
  const rule = new NthWeekday({ year: 2025, month: 9, weekday: 'monday', n: 1 });
  assertDate(rule.resolve(2025), 2025, 8, 1);
});

test('NthWeekday: rejects a fifth weekday when only four exist', () => {
  // November 2024 has four Thursdays. Requesting the fifth should throw.
  const rule = new NthWeekday({ year: 2024, month: 11, weekday: 'thursday', n: 5 });
  assert.throws(() => rule.resolve(2024), /has no/);
});

test('NthWeekday: rejects unknown weekday name', () => {
  assert.throws(
    () => new NthWeekday({ year: 2025, month: 1, weekday: 'funday', n: 1 }),
    /Unknown weekday/
  );
});

test('NthWeekday: rejects n=0', () => {
  assert.throws(
    () => new NthWeekday({ year: 2025, month: 1, weekday: 'monday', n: 0 }),
    /non-zero/
  );
});

test('NthWeekday: rejects non-integer year on resolve', () => {
  const rule = new NthWeekday({ year: 2025, month: 1, weekday: 'monday', n: 1 });
  assert.throws(() => rule.resolve(2025.5), /integer/);
});

test('NearestWeekday: weekday target returns same date', () => {
  // 1 Jan 2025 is a Wednesday.
  const rule = new NearestWeekday({ year: 2025, month: 1, day: 1 });
  assertDate(rule.resolve(2025), 2025, 0, 1);
});

test('NearestWeekday: Saturday target moves back to Friday', () => {
  // 1 Jan 2022 is a Saturday. Observed Friday is 31 Dec 2021.
  const rule = new NearestWeekday({ year: 2022, month: 1, day: 1 });
  assertDate(rule.resolve(2022), 2021, 11, 31);
});

test('NearestWeekday: Sunday target moves forward to Monday (tie-break)', () => {
  // 1 Jan 2023 is a Sunday. Documented rule: move forward to Monday.
  const rule = new NearestWeekday({ year: 2023, month: 1, day: 1 });
  assertDate(rule.resolve(2023), 2023, 0, 2);
});

test('NearestWeekday: rejects nonexistent date like 31 February', () => {
  const rule = new NearestWeekday({ year: 2025, month: 2, day: 31 });
  assert.throws(() => rule.resolve(2025), /does not exist/);
});

test('FixedDate: returns the literal date', () => {
  const rule = new FixedDate({ year: 2025, month: 7, day: 4 });
  assertDate(rule.resolve(2025), 2025, 6, 4);
});

test('FixedDate: rejects nonexistent date', () => {
  const rule = new FixedDate({ year: 2025, month: 2, day: 30 });
  assert.throws(() => rule.resolve(2025), /does not exist/);
});

test('Engine: register and resolve by name', () => {
  const eng = new Engine();
  eng.register('thanksgiving', new NthWeekday({ year: 2024, month: 11, weekday: 'thursday', n: 4 }));
  assertDate(eng.resolve('thanksgiving', 2024), 2024, 10, 28);
});

test('Engine: resolve throws on unknown name', () => {
  const eng = new Engine();
  assert.throws(() => eng.resolve('nope', 2025), /No holiday registered/);
});

test('Engine: resolveAll returns sorted holidays', () => {
  const eng = new Engine();
  eng.register('newyear', new NearestWeekday({ year: 2025, month: 1, day: 1 }));
  eng.register('independence', new FixedDate({ year: 2025, month: 7, day: 4 }));
  eng.register('labor', new NthWeekday({ year: 2025, month: 9, weekday: 'monday', n: 1 }));
  const all = eng.resolveAll(2025);
  assert.equal(all.length, 3);
  // Sorted ascending by date: New Year (Jan), Independence (Jul), Labor (Sep).
  assert.equal(all[0].name, 'newyear');
  assert.equal(all[1].name, 'independence');
  assert.equal(all[2].name, 'labor');
  assert.ok(all[0].date.getTime() < all[1].date.getTime());
  assert.ok(all[1].date.getTime() < all[2].date.getTime());
});

test('Engine: register overwrites existing key', () => {
  const eng = new Engine();
  eng.register('x', new FixedDate({ year: 2025, month: 1, day: 1 }));
  eng.register('x', new FixedDate({ year: 2025, month: 2, day: 2 }));
  assertDate(eng.resolve('x', 2025), 2025, 1, 2);
});

test('Engine: register validates rule shape', () => {
  const eng = new Engine();
  assert.throws(() => eng.register('bad', { not: 'a rule' }), /resolve/);
});
