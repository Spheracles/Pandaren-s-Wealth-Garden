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

test('both cockpit styles are selectable and the ink layer only applies to .th-ink', () => {
  const logic = readFileSync(new URL('../src/ui/logic.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../src/ui/styles.css', import.meta.url), 'utf8');
  assert.ok(body.includes('set.themes') && body.includes('{{o.pick}}'), 'style picker in settings');
  assert.ok(body.includes('class="seat-neon"') && body.includes('class="seat-ink"'), 'each style keeps its own seat');
  assert.match(logic, /var PAL = \{\s*neon:/);
  assert.match(logic, /'wg-theme'/);
  assert.match(logic, /'th-' \+ THEME/);
  // every rule after the INKED COCKPIT header must be scoped to the ink style (or be a keyframes block)
  const start = css.lastIndexOf('/* =====', css.indexOf('INKED COCKPIT'));
  const ink = css.slice(start).replace(/\/\*[\s\S]*?\*\//g, '').replace(/@keyframes[^{]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const selectors = [...ink.matchAll(/(?:^|[}\n])\s*([^@{}][^{}]*)\{/g)].map((m) => m[1].trim()).filter((s) => s && !s.startsWith('@'));
  assert.ok(selectors.length > 200);
  const topSplit = (s) => { const out = []; let d = 0, cur = ''; for (const ch of s) { if (ch === '(') d++; if (ch === ')') d--; if (ch === ',' && !d) { out.push(cur); cur = ''; } else cur += ch; } out.push(cur); return out; };
  const loose = selectors.flatMap(topSplit).map((s) => s.trim()).filter((s) => !/th-ink/.test(s));
  assert.deepEqual(loose, []);
});
