import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  HOST_PROVIDED_ENV,
  TEMPLATE_ONLY_KEYS,
  readTemplateVariables,
  scanEnvInventory,
} from './env-inventory';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));
const TEMPLATE = '.env.deploy.example';

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL/;
const PLACEHOLDERS = new Set(['', 'change-me']);
const URL_CREDENTIALS = /:\/\/[^:@/\s]+:([^:@/\s]+)@/g;

const inventory = scanEnvInventory(REPO_ROOT);
const declared = readTemplateVariables(REPO_ROOT, TEMPLATE);
const deployContractNames = inventory.reads
  .map((read) => read.name)
  .filter((name) => !HOST_PROVIDED_ENV.has(name));

function secretShapedKeys(): string[] {
  return [...declared.keys()].filter((key) => SECRET_KEY_PATTERN.test(key));
}

function describeUnresolved(): string {
  return inventory.unresolved
    .map(
      (entry) =>
        `${entry.file}:${entry.line} ${entry.reason} -> ${entry.manualStep}`,
    )
    .join('\n');
}

describe('workspace deployment contract', () => {
  it('resolves every environment read in the workspace to a name', () => {
    expect(
      inventory.unresolved.map((entry) => `${entry.file}:${entry.line}`),
      `environment reads this scan cannot derive:\n${describeUnresolved()}`,
    ).toEqual([]);
  });

  it('exercises every access path the code actually uses, so the scan cannot go blind again', () => {
    const usedPaths = new Set(
      inventory.reads.flatMap((read) => [...read.paths]),
    );

    expect(
      ['member', 'dynamic-wrapper', 'loader-wrapper'].filter(
        (path) => !usedPaths.has(path as 'member'),
      ),
      'no variable in this workspace is discovered through these access paths, so the rule behind them is untested against real code',
    ).toEqual([]);
  });

  it('classifies at least one variable as required, so the obligation signal is live', () => {
    const required = inventory.reads
      .filter((read) => read.obligation === 'required')
      .map((read) => read.name);

    expect(required.length).toBeGreaterThan(0);
  });

  it('declares in .env.deploy.example every environment variable the code reads', () => {
    const undeclared = deployContractNames.filter(
      (name) => !declared.has(name),
    );

    expect(
      undeclared,
      `runtime variables missing from ${TEMPLATE}: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it('gives every required environment variable a non-empty value in .env.deploy.example', () => {
    const blank = inventory.reads
      .filter((read) => read.obligation === 'required')
      .map((read) => read.name)
      .filter((name) => !declared.has(name) || declared.get(name) === '');

    expect(
      blank,
      `required variables the container cannot start with: ${blank.join(', ')}`,
    ).toEqual([]);
  });

  it('declares in .env.deploy.example no variable that nothing reads', () => {
    const orphans = [...declared.keys()].filter(
      (key) =>
        !deployContractNames.includes(key) && !TEMPLATE_ONLY_KEYS.has(key),
    );

    expect(
      orphans,
      `variables in ${TEMPLATE} that no code reads: ${orphans.join(', ')}`,
    ).toEqual([]);
  });

  it('justifies every host-provided and template-only name in both directions', () => {
    const derived = new Set(inventory.reads.map((read) => read.name));

    const staleHostProvided = [...HOST_PROVIDED_ENV.keys()].filter(
      (name) => !derived.has(name),
    );
    const missingTemplateOnly = [...TEMPLATE_ONLY_KEYS.keys()].filter(
      (name) => !declared.has(name),
    );
    const declaredHostProvided = [...HOST_PROVIDED_ENV.keys()].filter((name) =>
      declared.has(name),
    );

    expect(
      {
        staleHostProvided,
        missingTemplateOnly,
        declaredHostProvided,
      },
      'host-provided and template-only allowances must each match reality exactly',
    ).toEqual({
      staleHostProvided: [],
      missingTemplateOnly: [],
      declaredHostProvided: [],
    });
  });

  it('keeps every secret-shaped value in .env.deploy.example a placeholder', () => {
    const keys = secretShapedKeys();

    expect(
      keys.length,
      'no secret-shaped key is declared, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = keys.filter((key) => {
      const value = declared.get(key) ?? '';
      if (!PLACEHOLDERS.has(value)) return true;
      for (const match of value.matchAll(URL_CREDENTIALS)) {
        if (!PLACEHOLDERS.has(match[1] ?? '')) return true;
      }
      return false;
    });

    expect(
      leaked,
      `non-placeholder secret values in ${TEMPLATE}: ${leaked.join(', ')}`,
    ).toEqual([]);
  });

  it('keeps the password inside every declared URL a placeholder', () => {
    const urls = [...declared.entries()].filter(([, value]) =>
      /:\/\/[^:@/\s]+:[^:@/\s]+@/.test(value),
    );

    expect(
      urls.length,
      'no declared value embeds URL credentials, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = urls.filter(([, value]) => {
      for (const match of value.matchAll(URL_CREDENTIALS)) {
        if (!PLACEHOLDERS.has(match[1] ?? '')) return true;
      }
      return false;
    });

    expect(
      leaked.map(([key]) => key),
      `URL credentials that are not placeholders in ${TEMPLATE}`,
    ).toEqual([]);
  });
});
