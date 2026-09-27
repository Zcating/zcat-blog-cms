import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  HOST_PROVIDED_ENV,
  TEMPLATE_ONLY_KEYS,
  readTemplateVariables,
  scanEnvInventory,
} from '../../../backend/src/deploy/env-inventory';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const TEMPLATE = '.env.deploy.example';

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL/;
const PLACEHOLDERS = new Set(['', 'change-me']);

const inventory = scanEnvInventory(REPO_ROOT);
const declared = readTemplateVariables(REPO_ROOT, TEMPLATE);
const contractNames = inventory.reads
  .map((read) => read.name)
  .filter((name) => !HOST_PROVIDED_ENV.has(name));

function describeUnresolved(): string {
  return inventory.unresolved
    .map(
      (entry) =>
        `${entry.file}:${entry.line} ${entry.reason} -> ${entry.manualStep}`,
    )
    .join('\n');
}

describe('workspace deployment contract', () => {
  it('derives a non-empty set of runtime variables spanning every app and the packages', () => {
    const owners = new Set(
      inventory.reads.flatMap((read) =>
        read.sites.map((site) => site.file.split('/').slice(0, 2).join('/')),
      ),
    );

    expect(inventory.reads.length).toBeGreaterThan(0);
    for (const owner of [
      'apps/backend',
      'apps/blog',
      'apps/frontend',
      'packages/ui',
    ]) {
      expect([...owners]).toContain(owner);
    }
  });

  it('resolves every environment read the workspace performs, naming the manual step for any it cannot', () => {
    expect(
      inventory.unresolved.map((entry) => `${entry.file}:${entry.line}`),
      `environment reads this scan cannot derive:\n${describeUnresolved()}`,
    ).toEqual([]);
  });

  it('declares in .env.deploy.example every runtime variable the code reads', () => {
    const undeclared = contractNames.filter((name) => !declared.has(name));

    expect(
      undeclared,
      `runtime variables missing from ${TEMPLATE}: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it('declares in .env.deploy.example no variable that nothing reads', () => {
    const orphans = [...declared.keys()].filter(
      (key) => !contractNames.includes(key) && !TEMPLATE_ONLY_KEYS.has(key),
    );

    expect(
      orphans,
      `variables in ${TEMPLATE} that no code reads: ${orphans.join(', ')}`,
    ).toEqual([]);
  });

  it('redacts every secret-shaped value in .env.deploy.example, whether or not the real env files exist', () => {
    const keys = [...declared.keys()].filter((key) =>
      SECRET_KEY_PATTERN.test(key),
    );

    expect(
      keys.length,
      'no secret-shaped key is declared, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = keys.filter(
      (key) => !PLACEHOLDERS.has(declared.get(key) ?? ''),
    );

    expect(
      leaked,
      `non-placeholder secret values in ${TEMPLATE}: ${leaked.join(', ')}`,
    ).toEqual([]);
  });
});
