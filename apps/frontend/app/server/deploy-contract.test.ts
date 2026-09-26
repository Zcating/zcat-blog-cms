import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const TEMPLATE = join(REPO_ROOT, '.env.deploy.example');
const REAL_DEPLOY_FILES = [
  join(REPO_ROOT, '.env.deploy'),
  join(REPO_ROOT, '.env.deploy.dev'),
];

const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.nyc_output',
  '.output',
  '.tanstack',
  '.nitro',
  '.vite',
  '.git',
  '.worktrees',
  'worktrees',
  'playwright-report',
  'test-results',
]);

const SCANNED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
]);

const NOT_DEPLOYED_RUNTIME = /\.(?:test|spec|config)\.[^.]+$|\.d\.ts$/;

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL/;

const RUNTIME_READ_PATTERNS = [
  /\bprocess\.env\.([A-Za-z_][A-Za-z0-9_]*)/g,
  /\bimport\.meta\.env\.(VITE_[A-Za-z0-9_]+)/g,
];

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        files.push(...collectSourceFiles(join(directory, entry.name)));
      }
      continue;
    }
    if (!SCANNED_EXTENSIONS.has(extname(entry.name))) continue;
    if (NOT_DEPLOYED_RUNTIME.test(entry.name)) continue;
    files.push(join(directory, entry.name));
  }
  return files;
}

function deriveRuntimeVariables(): Set<string> {
  const variables = new Set<string>();
  for (const file of collectSourceFiles(REPO_ROOT)) {
    const source = readFileSync(file, 'utf8');
    for (const pattern of RUNTIME_READ_PATTERNS) {
      for (const match of source.matchAll(pattern)) {
        const name = match[1];
        if (name !== undefined) variables.add(name);
      }
    }
  }
  return variables;
}

function readAssignments(file: string): Array<[string, string]> {
  return readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))
    .map((line) => {
      const separator = line.indexOf('=');
      return [
        line.slice(0, separator).trim(),
        line.slice(separator + 1).trim(),
      ] as [string, string];
    })
    .filter(([key]) => key.length > 0);
}

function declaredVariables(): Set<string> {
  if (!existsSync(TEMPLATE)) return new Set();
  return new Set(readAssignments(TEMPLATE).map(([key]) => key));
}

function secretValuesInRealDeployFiles(): Array<{
  file: string;
  key: string;
  value: string;
}> {
  const found: Array<{ file: string; key: string; value: string }> = [];
  for (const file of REAL_DEPLOY_FILES) {
    if (!existsSync(file)) continue;
    for (const [key, value] of readAssignments(file)) {
      if (!SECRET_KEY_PATTERN.test(key)) continue;
      if (value.length === 0) continue;
      found.push({ file, key, value });
    }
  }
  return found;
}

describe('workspace deployment contract', () => {
  it('derives a non-empty set of runtime variables from the code', () => {
    const derived = [...deriveRuntimeVariables()].sort();

    expect(derived.length).toBeGreaterThan(0);
    expect(derived).toContain('BACKEND_API_URL');
    expect(derived).toContain('VITE_API_URL');
  });

  it('declares in .env.deploy.example every runtime variable the code reads', () => {
    const derived = [...deriveRuntimeVariables()].sort();
    const declared = declaredVariables();
    const undeclared = derived.filter((name) => !declared.has(name));

    expect(
      undeclared,
      `runtime variables missing from .env.deploy.example: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it('leaks no real secret value from the deploy env files into .env.deploy.example', () => {
    const template = readFileSync(TEMPLATE, 'utf8');
    const leaked = secretValuesInRealDeployFiles()
      .filter((entry) => template.includes(entry.value))
      .map((entry) => `${entry.key} (from ${relative(REPO_ROOT, entry.file)})`);

    expect(
      leaked,
      `real secret values present in .env.deploy.example: ${leaked.join(', ')}`,
    ).toEqual([]);
  });
});
