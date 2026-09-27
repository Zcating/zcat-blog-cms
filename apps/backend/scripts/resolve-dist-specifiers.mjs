import {
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * tsc emits ES module specifiers exactly as written, so the compiled output
 * keeps extensionless relative imports and the `@backend/*` path alias. A
 * bundler resolves both; bare Node, which is what the container runs, resolves
 * neither. This rewrites the emitted specifiers to real file paths so `dist`
 * runs under plain `node`, and fails the build if any target is missing.
 */

const DIST = resolve(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const SOURCE_ROOT = join(DIST, 'src');
const ALIAS_PREFIX = '@backend/';
const HAS_EXTENSION = /\.(?:js|mjs|cjs|json|node)$/;

const SPECIFIER = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(['"])([^'"\n]+)\2/g;

function collectJsFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const abs = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectJsFiles(abs));
    else if (entry.name.endsWith('.js')) files.push(abs);
  }
  return files;
}

function resolveToFile(candidate) {
  if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  if (existsSync(`${candidate}.js`)) return `${candidate}.js`;
  const index = join(candidate, 'index.js');
  if (existsSync(index)) return index;
  return undefined;
}

function toRelativeSpecifier(fromFile, targetFile) {
  let specifier = relative(dirname(fromFile), targetFile).split(sep).join('/');
  if (!specifier.startsWith('.')) specifier = `./${specifier}`;
  return specifier;
}

const unresolved = [];
let rewritten = 0;

for (const file of collectJsFiles(DIST)) {
  const original = readFileSync(file, 'utf8');
  const updated = original.replace(
    SPECIFIER,
    (match, lead, quote, specifier) => {
      if (HAS_EXTENSION.test(specifier)) return match;
      if (!specifier.startsWith('.') && !specifier.startsWith(ALIAS_PREFIX)) {
        return match;
      }
      const base = specifier.startsWith(ALIAS_PREFIX)
        ? join(SOURCE_ROOT, specifier.slice(ALIAS_PREFIX.length))
        : resolve(dirname(file), specifier);
      const target = resolveToFile(base);
      if (!target) {
        unresolved.push(`${relative(DIST, file)} -> ${specifier}`);
        return match;
      }
      rewritten += 1;
      return `${lead}${quote}${toRelativeSpecifier(file, target)}${quote}`;
    },
  );
  if (updated !== original) writeFileSync(file, updated, 'utf8');
}

if (unresolved.length > 0) {
  console.error(
    `resolve-dist-specifiers: ${unresolved.length} specifier(s) in dist/ do not resolve to an emitted file:`,
  );
  for (const entry of unresolved) console.error(`  ${entry}`);
  process.exit(1);
}

console.log(
  `resolve-dist-specifiers: rewrote ${rewritten} specifier(s) in dist/ for bare Node ESM`,
);
