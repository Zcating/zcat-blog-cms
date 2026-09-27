import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  CONTAINER_ENV_TEMPLATE,
  CONTAINER_ONLY_KEYS,
  HOST_PROVIDED_ENV,
  PUSH_ENV_TEMPLATE,
  type EnvRead,
  deployScope,
  envFileNameFor,
  readComposeEnvFiles,
  readTemplateVariables,
  scanEnvInventory,
} from './env-inventory';

const REPO_ROOT = fileURLToPath(new URL('../../../..', import.meta.url));

const SECRET_KEY_PATTERN = /PASSWORD|SECRET|KEY|TOKEN|CREDENTIAL/;
const PLACEHOLDERS = new Set(['', 'change-me']);
const URL_CREDENTIALS = /:\/\/[^:@/\s]+:([^:@/\s]+)@/g;

const inventory = scanEnvInventory(REPO_ROOT);
const containerTemplate = readTemplateVariables(
  REPO_ROOT,
  CONTAINER_ENV_TEMPLATE,
);
const pushTemplate = readTemplateVariables(REPO_ROOT, PUSH_ENV_TEMPLATE);
const composeEnvFiles = readComposeEnvFiles(REPO_ROOT);

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

function requiredNames(): string[] {
  return inventory.reads
    .filter((read) => read.obligation === 'required')
    .map((read) => read.name);
}

function secretShapedKeys(): string[] {
  return [...containerTemplate.keys(), ...pushTemplate.keys()].filter((key) =>
    SECRET_KEY_PATTERN.test(key),
  );
}

function valueOf(key: string): string {
  return pushTemplate.get(key) ?? containerTemplate.get(key) ?? '';
}

function leaksSecretValue(value: string): boolean {
  if (!PLACEHOLDERS.has(value)) return true;
  return leaksUrlCredential(value);
}

function leaksUrlCredential(value: string): boolean {
  for (const match of value.matchAll(URL_CREDENTIALS)) {
    if (!PLACEHOLDERS.has(match[1] ?? '')) return true;
  }
  return false;
}

function isDeclaredAnywhere(key: string): boolean {
  return containerTemplate.has(key) || pushTemplate.has(key);
}

function containerReads(read: EnvRead): boolean {
  const scope = deployScope(read);
  return scope === 'container' || scope === 'both';
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
      ['member', 'dynamic-wrapper', 'loader-wrapper', 'file-loader'].filter(
        (path) => !usedPaths.has(path as 'member'),
      ),
      'no variable in this workspace is discovered through these access paths, so the rule behind them is untested against real code',
    ).toEqual([]);
  });

  it('classifies at least one variable as required, so the obligation signal is live', () => {
    expect(requiredNames().length).toBeGreaterThan(0);
  });

  it('splits the reads between a container process and the push script, so the placement rules below are not vacuous', () => {
    expect(namesIn('container').length).toBeGreaterThan(0);
    expect(namesIn('operator').length).toBeGreaterThan(0);
  });

  it(`declares in ${CONTAINER_ENV_TEMPLATE} every variable a container reads`, () => {
    const undeclared = namesIn('container').filter(
      (name) => !containerTemplate.has(name),
    );

    expect(
      undeclared,
      `container variables missing from ${CONTAINER_ENV_TEMPLATE}: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it(`declares in ${PUSH_ENV_TEMPLATE} every variable only scripts/docker-push.ts reads`, () => {
    const undeclared = namesIn('operator').filter(
      (name) => !pushTemplate.has(name),
    );

    expect(
      undeclared,
      `push-script variables missing from ${PUSH_ENV_TEMPLATE}: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it('declares each read in exactly the files its own process loads', () => {
    const misplaced = inventory.reads
      .filter((read) => !HOST_PROVIDED_ENV.has(read.name))
      .filter((read) => {
        const scope = deployScope(read);
        return (
          containerTemplate.has(read.name) !== (scope !== 'operator') ||
          pushTemplate.has(read.name) !== (scope !== 'container')
        );
      })
      .map(
        (read) =>
          `${read.name} (${deployScope(read)}: ${[
            containerTemplate.has(read.name) ? CONTAINER_ENV_TEMPLATE : null,
            pushTemplate.has(read.name) ? PUSH_ENV_TEMPLATE : null,
          ]
            .filter(Boolean)
            .join(' + ')})`,
      );

    expect(
      misplaced,
      `reads declared in a file their process never loads: ${misplaced.join(', ')}`,
    ).toEqual([]);
  });

  it(`declares no push-script variable in ${CONTAINER_ENV_TEMPLATE}, which compose hands to every service`, () => {
    const leaked = inventory.reads
      .filter((read) => !containerReads(read))
      .map((read) => read.name)
      .filter((name) => containerTemplate.has(name));

    expect(
      leaked,
      `push credentials reaching containers through ${CONTAINER_ENV_TEMPLATE}: ${leaked.join(', ')}`,
    ).toEqual([]);
  });

  it('gives every required environment variable a non-empty value in .env.deploy.example', () => {
    const blank = requiredNames().filter(
      (name) =>
        !containerTemplate.has(name) || containerTemplate.get(name) === '',
    );

    expect(
      blank,
      `required variables the container cannot start with: ${blank.join(', ')}`,
    ).toEqual([]);
  });

  it(`declares in ${CONTAINER_ENV_TEMPLATE} every key a container image consumes itself`, () => {
    const undeclared = [...CONTAINER_ONLY_KEYS.keys()].filter(
      (name) => !containerTemplate.has(name),
    );

    expect(
      undeclared,
      `image-consumed keys missing from ${CONTAINER_ENV_TEMPLATE}: ${undeclared.join(', ')}`,
    ).toEqual([]);
  });

  it('declares in neither template a variable that nothing reads', () => {
    const derived = new Set(inventory.reads.flatMap((read) => [read.name]));
    const allowed = new Set([
      ...CONTAINER_ONLY_KEYS.keys(),
      ...HOST_PROVIDED_ENV.keys(),
    ]);
    const orphans = {
      inContainer: [...containerTemplate.keys()].filter(
        (key) => !derived.has(key) && !allowed.has(key),
      ),
      inPush: [...pushTemplate.keys()].filter(
        (key) => !derived.has(key) && !allowed.has(key),
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

  it('justifies every host-provided and container-image name in both directions', () => {
    const derived = new Set(inventory.reads.map((read) => read.name));
    const staleHostProvided = [...HOST_PROVIDED_ENV.keys()].filter(
      (name) => !derived.has(name),
    );
    const staleContainerOnly = [...CONTAINER_ONLY_KEYS.keys()].filter((name) =>
      derived.has(name),
    );
    const declaredHostProvided = [...HOST_PROVIDED_ENV.keys()].filter((name) =>
      isDeclaredAnywhere(name),
    );
    const declaredOutsideContainer = [...CONTAINER_ONLY_KEYS.keys()].filter(
      (name) => pushTemplate.has(name),
    );

    expect(
      {
        staleHostProvided,
        staleContainerOnly,
        declaredHostProvided,
        declaredOutsideContainer,
      },
      'host-provided and container-image allowances must each match reality exactly',
    ).toEqual({
      staleHostProvided: [],
      staleContainerOnly: [],
      declaredHostProvided: [],
      declaredOutsideContainer: [],
    });
  });

  it(`keeps every secret-shaped value in ${CONTAINER_ENV_TEMPLATE} and ${PUSH_ENV_TEMPLATE} a placeholder`, () => {
    const keys = secretShapedKeys();

    expect(
      keys.length,
      'no secret-shaped key is declared, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = keys.filter((key) => leaksSecretValue(valueOf(key)));

    expect(
      leaked,
      `non-placeholder secret values in the templates: ${leaked.join(', ')}`,
    ).toEqual([]);
  });

  it('keeps the password inside every declared URL a placeholder', () => {
    const urls = [...containerTemplate, ...pushTemplate].filter(([, value]) =>
      /:\/\/[^:@/\s]+:[^:@/\s]+@/.test(value),
    );

    expect(
      urls.length,
      'no declared value embeds URL credentials, so this assertion would be vacuous',
    ).toBeGreaterThan(0);

    const leaked = urls
      .filter(([, value]) => leaksUrlCredential(value))
      .map(([key]) => key);

    expect(
      leaked,
      `URL credentials that are not placeholders in the templates`,
    ).toEqual([]);
  });

  it('supplies the container env file to compose and never the push env file', () => {
    const containerEnvFile = envFileNameFor(CONTAINER_ENV_TEMPLATE);
    const pushEnvFile = envFileNameFor(PUSH_ENV_TEMPLATE);

    expect(
      composeEnvFiles.size,
      'no env_file entry was read from docker-compose.yml, so this assertion would be vacuous',
    ).toBeGreaterThan(0);
    expect(
      [...composeEnvFiles].filter(
        (file) =>
          file !== containerEnvFile && file !== 'apps/backend/.env.production',
      ),
      `docker-compose.yml supplies an env file neither template documents: ${[...composeEnvFiles].join(', ')}`,
    ).toEqual([]);
    expect(
      composeEnvFiles.has(pushEnvFile),
      `${pushEnvFile} is supplied to a container, so the push credentials reach it`,
    ).toBe(false);
  });
});
