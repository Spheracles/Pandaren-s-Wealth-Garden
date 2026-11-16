/* Template sanity checks for the NEON CITY web UI (no browser needed). */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { templateBody } from '../scripts/build.mjs';

const body = templateBody();
const count = (re) => (body.match(re) || []).length;

test('all template macros are expanded', () => {
  assert.equal(count(/@@[A-Z/][^@]*@@/g), 0);
});

test('sc-for / sc-if blocks are balanced', () => {
  assert.equal(count(/<sc-for\b/g), count(/<\/sc-for>/g));
  assert.equal(count(/<sc-if\b/g), count(/<\/sc-if>/g));
});

test('template holes are plain lookups only (no expressions)', () => {
  const holes = [...body.matchAll(/\{\{\s*([^}]*?)\s*\}\}/g)].map((m) => m[1]);
  assert.ok(holes.length > 500);
  const bad = holes.filter((h) => !/^(\$?[\w.]+|true|false|-?\d+)$/.test(h));
  assert.deepEqual([...new Set(bad)], []);
});

test('every page and dialog is present', () => {
  for (const p of ['dashboard', 'ledger', 'resources', 'assets', 'garden', 'projects', 'ai', 'reports', 'notifications', 'settings']) {
    assert.ok(body.includes(`pg.${p}`), `page ${p}`);
  }
  for (const d of ['tx', 'act', 'proj', 'confirm', 'export', 'imp']) assert.ok(body.includes(`md.is_${d}`), `dialog ${d}`);
});

test('the UI never claims a live AI connection and keeps the demo label', () => {
  const logic = readFileSync(new URL('../src/ui/logic.js', import.meta.url), 'utf8');
  assert.ok(body.includes('AI 未連線'));
  assert.ok(body.includes('示範模式'));
  assert.ok(!/apiKey\s*[:=]\s*['"][^'"]+/.test(logic), 'no API key literal in the UI logic');
});

test('older local data keys are read for migration', () => {
  const logic = readFileSync(new URL('../src/ui/logic.js', import.meta.url), 'utf8');
  assert.match(logic, /LEGACY_KEYS = \['wealth-garden-state', 'wealth-garden-neon-v1'\]/);
});
