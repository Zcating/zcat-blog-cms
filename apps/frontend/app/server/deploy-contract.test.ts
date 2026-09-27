import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CONTAINER_ENV_TEMPLATE,
  CONTAINER_ONLY_KEYS,
  HOST_PROVIDED_ENV,
  PUSH_ENV_TEMPLATE,
  deployScope,
  readTemplateVariables,
  scanEnvInventory,
} from '../../../backend/src/deploy/env-inventory';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL/;
const PLACEHOLDERS = new Set(['', 'change-me']);

const inventory = scanEnvInventory(REPO_ROOT);
const containerTemplate = readTemplateVariables(
  REPO_ROOT,
  CONTAINER_ENV_TEMPLATE,
);
const pushTemplate = readTemplateVariables(REPO_ROOT, PUSH_ENV_TEMPLATE);

function namesIn(scope: 'container' | 'operator'): string[] {
  return inventory.reads
    .filter((read) => {
      const derived = deployScope(read);
      return derived === 'both' || derived === scope;
    })
    .map((read) => read.name)
    .filter((name) => !HOST_PROVIDED_ENV.has(name));
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

  it('declares every runtime variable the code reads in the file its own process loads', () => {
    const undeclared = {
      inContainer: namesIn('container').filter(
        (name) => !containerTemplate.has(name),
      ),
      inPush: namesIn('operator').filter((name) => !pushTemplate.has(name)),
    };

    expect(
      undeclared,
      `runtime variables missing from the file that supplies them: ${[
        ...undeclared.inContainer.map(
          (name) => `${name} -> ${CONTAINER_ENV_TEMPLATE}`,
        ),
        ...undeclared.inPush.map((name) => `${name} -> ${PUSH_ENV_TEMPLATE}`),
      ].join(', ')}`,
    ).toEqual({ inContainer: [], inPush: [] });
  });

  it('declares no push credential in the file compose hands to every service', () => {
    const leaked = namesIn('operator').filter((name) =>
      containerTemplate.has(name),
    );

    expect(
      leaked,
      `push credentials reaching containers through ${CONTAINER_ENV_TEMPLATE}: ${leaked.join(', ')}`,
    ).toEqual([]);
  });

  it('declares no variable in either template that nothing reads', () => {
    const read = new Set(inventory.reads.map((entry) => entry.name));
    const allowed = new Set([
      ...CONTAINER_ONLY_KEYS.keys(),
      ...HOST_PROVIDED_ENV.keys(),
    ]);
    const orphans = {
      inContainer: [...containerTemplate.keys()].filter(
        (key) => !read.has(key) && !allowed.has(key),
      ),
      inPush: [...pushTemplate.keys()].filter(
        (key) => !read.has(key) && !allowed.has(key),
      ),
    };

    expect(
      orphans,
      `variables in the templates that no code reads: ${[
        ...orphans.inContainer.map(
          (key) => `${key} -> ${CONTAINER_ENV_TEMPLATE}`,
        ),
        ...orphans.inPush.map((key) => `${key} -> ${PUSH_ENV_TEMPLATE}`),
      ].join(', ')}`,
    ).toEqual({ inContainer: [], inPush: [] });
  });

  it('redacts every secret-shaped value in both templates, whether or not the real env files exist', () => {
    const keys = [...containerTemplate, ...pushTemplate]
      .map(([key]) => key)
      .filter((key) => SECRET_KEY_PATTERN.test(key));

    expect(
      keys.length,
      'no secret-shaped key is declared, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = keys.filter((key) => {
      const value = pushTemplate.get(key) ?? containerTemplate.get(key) ?? '';
      return !PLACEHOLDERS.has(value);
    });

    expect(
      leaked,
      `non-placeholder secret values in the templates: ${leaked.join(', ')}`,
    ).toEqual([]);
  });
});
