import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coerceConfigValue, DEFAULTS } from '../src/config.mjs';

test('coerceConfigValue: numeric keys accept valid positive numbers', () => {
  assert.equal(coerceConfigValue('focusMinutes', '30'), 30);
  assert.equal(coerceConfigValue('focusMinutes', 30), 30);
  assert.equal(coerceConfigValue('focusMinutes', '0.5'), 0.5);
});

test('coerceConfigValue: numeric keys reject non-numbers and non-positive', () => {
  assert.throws(() => coerceConfigValue('focusMinutes', 'abc'), /must be a number/);
  assert.throws(() => coerceConfigValue('focusMinutes', NaN), /must be a number/);
  assert.throws(() => coerceConfigValue('focusMinutes', 0), /greater than 0/);
  assert.throws(() => coerceConfigValue('focusMinutes', -5), /greater than 0/);
  assert.throws(() => coerceConfigValue('focusMinutes', '-1'), /greater than 0/);
});

test('coerceConfigValue: boolean keys accept common truthy/falsy strings', () => {
  assert.equal(coerceConfigValue('notify', 'true'), true);
  assert.equal(coerceConfigValue('notify', '1'), true);
  assert.equal(coerceConfigValue('notify', 'false'), false);
  assert.equal(coerceConfigValue('notify', '0'), false);
});

test('coerceConfigValue: boolean keys reject garbage', () => {
  assert.throws(() => coerceConfigValue('notify', 'yes'), /must be true or false/);
  assert.throws(() => coerceConfigValue('notify', '2'), /must be true or false/);
});

test('coerceConfigValue: unknown key rejected with allowed list', () => {
  assert.throws(() => coerceConfigValue('nope', 'x'), /unknown config key "nope"/);
});

test('coerceConfigValue: string keys pass through', () => {
  assert.equal(coerceConfigValue('label', 'deep work'), 'deep work');
  assert.equal(coerceConfigValue('label', ''), '');
});

test('DEFAULTS shape', () => {
  for (const k of ['focusMinutes', 'breakMinutes', 'longBreakMinutes']) {
    assert.ok(DEFAULTS[k] > 0, `${k} should be positive`);
  }
  assert.equal(typeof DEFAULTS.notify, 'boolean');
  assert.equal(typeof DEFAULTS.beep, 'boolean');
});
