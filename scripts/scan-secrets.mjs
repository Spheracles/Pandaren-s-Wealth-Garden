// Usage: node scripts/scan-secrets.mjs [dir-or-zip ...]   (default: the repository)
import fs from 'node:fs';
import path from 'node:path';
import JSZip from 'jszip';
import { walk, assertClean } from './lib/secrets.mjs';

const targets = process.argv.slice(2);
if (!targets.length) targets.push('.');
for (const t of targets) {
  if (t.endsWith('.zip')) {
    const zip = await JSZip.loadAsync(fs.readFileSync(t));
    const entries = [];
    for (const [name, f] of Object.entries(zip.files)) if (!f.dir) { const buf = await f.async('nodebuffer'); entries.push({ path: name, read: () => buf }); }
    assertClean(entries, path.basename(t));
  } else {
    const skip = (rel, name) => ['node_modules', '.git', 'dist', 'build', '.gradle', '.idea', 'release'].includes(name);
    assertClean(walk(t, skip), t === '.' ? 'repository' : t);
  }
}
