// Fails the build if anything that looks like a credential is about to be committed.
// Runs in `npm run verify` and in CI.
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-server',
  'coverage',
  'playwright-report',
  'test-results',
  '.vercel',
]);
const SKIP_FILES = new Set(['package-lock.json']);
const TEXT_FILE = /\.(ts|tsx|js|jsx|mjs|cjs|json|md|html|css|yml|yaml|txt|env|example)$/i;

// Each pattern is assembled at runtime so this file never contains a literal
// that matches itself.
const RULES = [
  { name: 'Google API key', re: new RegExp(['AIza', '[0-9A-Za-z_-]{35}'].join('')) },
  {
    name: 'private key block',
    re: new RegExp(['-----BEGIN', ' [A-Z ]*PRIVATE KEY-----'].join('')),
  },
  { name: 'OpenAI-style key', re: new RegExp(['sk-', '[A-Za-z0-9]{32,}'].join('')) },
  { name: 'GitHub token', re: new RegExp(['gh[pousr]_', '[A-Za-z0-9]{36,}'].join('')) },
  { name: 'AWS access key id', re: new RegExp(['AKIA', '[0-9A-Z]{16}'].join('')) },
  {
    name: 'assigned API key',
    re: new RegExp(
      ['[A-Z_]*(?:API_KEY|SECRET|TOKEN)', '\\s*[:=]\\s*["\'][^"\']{12,}["\']'].join(''),
    ),
  },
];

/** @param {string} dir @returns {AsyncGenerator<string>} */
async function* walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) yield* walk(full);
    } else if (entry.isFile() && !SKIP_FILES.has(entry.name)) {
      yield full;
    }
  }
}

// A line may opt out with this marker plus a reason, on the line itself or
// the line above it, for test fixtures that look like credentials but are not.
const ALLOW_MARKER = 'secret-scan-allow';
const findings = [];
const selfPath = join(ROOT, 'scripts', 'check-secrets.mjs');

for await (const file of walk(ROOT)) {
  if (file === selfPath) continue;

  const rel = relative(ROOT, file).split(sep).join('/');
  if (rel === '.env' || rel.startsWith('.env.')) {
    if (rel !== '.env.example') {
      findings.push({ rel, line: 0, name: 'environment file present in the tree' });
    }
  }
  if (!TEXT_FILE.test(file)) continue;

  // Read directly and tolerate the failure: never stat-then-read, which races.
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    continue;
  }

  const lines = text.split('\n');
  for (const rule of RULES) {
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i] ?? '';
      const previous = i > 0 ? (lines[i - 1] ?? '') : '';
      if (line.includes(ALLOW_MARKER) || previous.includes(ALLOW_MARKER)) continue;
      if (rule.re.test(line)) findings.push({ rel, line: i + 1, name: rule.name });
    }
  }
}

if (findings.length > 0) {
  console.error('Possible secrets found:');
  for (const f of findings) {
    console.error(`  ${f.rel}:${f.line}  ${f.name}`);
  }
  console.error('\nMove the value into .env (git-ignored) and read it from the environment.');
  process.exit(1);
}

console.log(`check-secrets: clean (${RULES.length} patterns)`);
