const assert = require('node:assert/strict');
const test = require('node:test');
const {
  MIN_ACTIVE_CRUSHES,
  MAX_FREE_ACTIVE_CRUSHES,
  canAddFreeActiveCrush,
  countActiveCrushes,
  isActiveCrush,
  isPrivacyReady,
  reciprocalMatchStatus,
  revealTransition,
} = require('../lib/matching/privateCircle');

const NOW = 1_000;

test('Private Circle thresholds remain fixed for v1.1', () => {
  assert.equal(MIN_ACTIVE_CRUSHES, 3);
  assert.equal(MAX_FREE_ACTIVE_CRUSHES, 5);
  assert.equal(isPrivacyReady(2), false);
  assert.equal(isPrivacyReady(3), true);
});

test('only non-expired active crush states count toward privacy readiness', () => {
  assert.equal(isActiveCrush({ status: 'pending', expiresAtMillis: NOW + 1 }, NOW), true);
  assert.equal(isActiveCrush({ status: 'matched', expiresAtMillis: NOW + 1 }, NOW), true);
  assert.equal(isActiveCrush({ status: 'unhooked', expiresAtMillis: NOW + 1 }, NOW), true);
  assert.equal(isActiveCrush({ status: 'expired', expiresAtMillis: NOW + 1 }, NOW), false);
  assert.equal(isActiveCrush({ status: 'pending', expiresAtMillis: NOW }, NOW), false);

  assert.equal(countActiveCrushes([
    { status: 'pending', expiresAtMillis: NOW + 1 },
    { status: 'matched', expiresAtMillis: NOW + 1 },
    { status: 'unhooked', expiresAtMillis: NOW + 1 },
    { status: 'expired', expiresAtMillis: NOW + 1 },
    { status: 'pending', expiresAtMillis: NOW - 1 },
  ], NOW), 3);
});

test('reciprocal matches remain hidden until both circles have three active crushes', () => {
  assert.equal(reciprocalMatchStatus(1, 3), 'privacy_hold');
  assert.equal(reciprocalMatchStatus(3, 2), 'privacy_hold');
  assert.equal(reciprocalMatchStatus(3, 3), 'pending_reveal');
  assert.equal(reciprocalMatchStatus(5, 5), 'pending_reveal');
});

test('free accounts cannot add a sixth active crush', () => {
  assert.equal(canAddFreeActiveCrush(4, false), true);
  assert.equal(canAddFreeActiveCrush(5, false), false);
  assert.equal(canAddFreeActiveCrush(5, true), true);
});

test('daily reveal re-checks eligibility and does not re-hide terminal states', () => {
  assert.equal(revealTransition('pending_reveal', 3, 3), 'active');
  assert.equal(revealTransition('privacy_hold', 3, 3), 'active');
  assert.equal(revealTransition('pending_reveal', 2, 3), 'privacy_hold');
  assert.equal(revealTransition('privacy_hold', 3, 2), 'privacy_hold');
  assert.equal(revealTransition('active', 0, 0), 'active');
  assert.equal(revealTransition('unhooked', 5, 5), 'unhooked');
  assert.equal(revealTransition('expired', 5, 5), 'expired');
});
