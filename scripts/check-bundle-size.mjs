// Enforces a gzipped size budget on the first paint: the entry chunk plus
// everything statically imported with it. Lazily loaded routes do not count,
// which is what makes code splitting worth doing.
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const BUDGETS = { js: 150 * 1024, css: 28 * 1024 };
const DIST = join(process.cwd(), 'dist');

let manifest;
try {
  manifest = JSON.parse(await readFile(join(DIST, '.vite', 'manifest.json'), 'utf8'));
} catch {
  console.error('check-size: dist/.vite/manifest.json is missing. Run the build first.');
  process.exit(1);
}

const entry = Object.values(manifest).find((chunk) => chunk.isEntry === true);
if (entry === undefined) {
  console.error('check-size: no entry chunk in the manifest.');
  process.exit(1);
}

/** Collect the entry and every chunk it pulls in synchronously. */
const files = new Set();
const seen = new Set();
const visit = (key) => {
  if (seen.has(key)) return;
  seen.add(key);
  const chunk = manifest[key];
  if (chunk === undefined) return;
  files.add(chunk.file);
  for (const css of chunk.css ?? []) files.add(css);
  for (const next of chunk.imports ?? []) visit(next);
};
visit(Object.keys(manifest).find((key) => manifest[key] === entry));

const totals = { js: 0, css: 0 };
for (const file of files) {
  const ext = file.endsWith('.js') ? 'js' : file.endsWith('.css') ? 'css' : null;
  if (ext === null) continue;
  totals[ext] += gzipSync(await readFile(join(DIST, file))).byteLength;
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
let failed = false;

for (const ext of ['js', 'css']) {
  const label = `${ext.toUpperCase()} ${kb(totals[ext])} of ${kb(BUDGETS[ext])} gzipped`;
  if (totals[ext] > BUDGETS[ext]) {
    console.error(`check-size: over budget - ${label}`);
    failed = true;
  } else {
    console.log(`check-size: ${label}`);
  }
}

if (failed) process.exit(1);
