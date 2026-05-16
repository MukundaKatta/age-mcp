import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { between } from '../src/server.js';

test('one whole year', () => {
  const r = between('2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z');
  assert.equal(r.years, 1);
  assert.equal(r.months, 0);
  assert.equal(r.days, 0);
  assert.equal(r.total_days, 365);
});

test('one whole month', () => {
  const r = between('2024-01-15T00:00:00Z', '2024-02-15T00:00:00Z');
  assert.equal(r.years, 0);
  assert.equal(r.months, 1);
  assert.equal(r.days, 0);
});

test('handles short-month boundary (Feb)', () => {
  const r = between('2024-01-31T00:00:00Z', '2024-03-01T00:00:00Z');
  // Jan 31 → Feb 29 (leap) = 29 days, then +1 day to Mar 1 = 1 month + 1 day.
  assert.equal(r.years, 0);
  assert.equal(r.months, 1);
  assert.equal(r.days, 1);
});

test('year + month + day breakdown', () => {
  const r = between('2000-05-10T00:00:00Z', '2026-05-11T00:00:00Z');
  assert.equal(r.years, 26);
  assert.equal(r.months, 0);
  assert.equal(r.days, 1);
});

test('reversed input gives negative result', () => {
  const r = between('2024-01-01T00:00:00Z', '2023-01-01T00:00:00Z');
  assert.equal(r.years, -1);
  assert.equal(r.total_days, -365);
  assert.match(r.display, /^-/);
});

test('display omits zero components', () => {
  const r = between('2023-01-01T00:00:00Z', '2024-01-01T00:00:00Z');
  assert.equal(r.display, '1 year');
});

test('rejects invalid dates', () => {
  assert.throws(() => between('not a date', '2024-01-01T00:00:00Z'));
});
