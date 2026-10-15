// Shared secret scanner used before ANY zip is produced.
// Blocks signing keys, keystore passwords, API keys, DB credentials and real user data exports.
import fs from 'node:fs';
import path from 'node:path';

const FORBIDDEN_NAMES = [
  /\.jks$/i, /\.keystore$/i, /\.p12$/i, /\.pfx$/i, /\.pem$/i, /\.key$/i,
  /(^|\/)keystore\.properties$/i, /(^|\/)local\.properties$/i,
  /(^|\/)\.env(\.(?!example$)[^/]+)?$/i, /(^|\/)google-services\.json$/i,
  /(^|\/)service-account.*\.json$/i, /WealthGarden-backup-.*\.json$/i,
];
const FORBIDDEN_CONTENT = [
  [/AIza[0-9A-Za-z_\-]{35}/, 'Google / Gemini API key'],
  [/\bsk-(proj-)?[A-Za-z0-9_\-]{20,}/, 'OpenAI API key'],
  [/-----BEGIN (RSA |EC |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/, 'private key'],
  [/\b(storePassword|keyPassword)\s*=\s*(?!請填入)[^\s#]{3,}/, 'keystore password'],
  [/\bservice_role\b[^\n]{0,40}eyJ[A-Za-z0-9_\-]{20,}/, 'Supabase service_role key'],
  [/postgres(ql)?:\/\/[^:\s]+:[^@\s]{4,}@/, 'database URL with password'],
  [/\bghp_[A-Za-z0-9]{30,}/, 'GitHub token'],
];
const TEXT_EXT = /\.(js|mjs|cjs|ts|tsx|json|md|txt|html|css|gradle|properties|xml|yml|yaml|sql|java|kt|sh|env|example)$/i;

/** @param {{path:string, read:()=>Buffer}[]} entries */
export function scanEntries(entries) {
  const problems = [];
  for (const e of entries) {
    const rel = e.path.replace(/\\/g, '/');
    if (FORBIDDEN_NAMES.some(r => r.test(rel))) { problems.push(`${rel}: forbidden file type`); continue; }
    if (!TEXT_EXT.test(rel)) continue;
    const text = e.read().toString('utf8');
    for (const [re, label] of FORBIDDEN_CONTENT) if (re.test(text)) problems.push(`${rel}: looks like a ${label}`);
  }
  return problems;
}

export function walk(dir, exclude = () => false, base = dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name), rel = path.relative(base, full).replace(/\\/g, '/');
    if (exclude(rel, name)) continue;
    const st = fs.lstatSync(full);
    if (st.isSymbolicLink()) continue;
    if (st.isDirectory()) out.push(...walk(full, exclude, base));
    else out.push({ path: rel, full, size: st.size, read: () => fs.readFileSync(full) });
  }
  return out;
}

export function assertClean(entries, label) {
  const problems = scanEntries(entries);
  if (problems.length) {
    console.error(`\n✖ ${label}: refusing to continue — sensitive content found:\n  - ` + problems.join('\n  - '));
    process.exit(2);
  }
  console.log(`✔ ${label}: no keys, passwords, credentials or user data found (${entries.length} files scanned)`);
}
