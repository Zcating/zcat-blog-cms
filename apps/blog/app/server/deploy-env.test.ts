import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { resolveBackendApiUrl } from './env';

const BLOG_DIR = join(import.meta.dirname, '..', '..');
const REPO_ROOT = join(BLOG_DIR, '..', '..');

const TEMPLATE = join(BLOG_DIR, '.env.example');
const DEPLOY_DEV = join(REPO_ROOT, '.env.deploy.dev');
const DEPLOY_PROD = join(REPO_ROOT, '.env.deploy');
const LOCAL_DEV = join(BLOG_DIR, '.env');
const CHECKED_ENV_FILES = [DEPLOY_DEV, DEPLOY_PROD, LOCAL_DEV, TEMPLATE];

function readEnvValue(file: string, key: string): string | undefined {
  const line = readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find((entry) => new RegExp(`^${key}\\s*=`).test(entry));
  return line?.split('=').slice(1).join('=').trim();
}

describe('blog deploy environment contract', () => {
  it.each(CHECKED_ENV_FILES.filter((file) => existsSync(file)))(
    'declares BACKEND_API_URL ending in /api in %s',
    (file) => {
      const value = readEnvValue(file, 'BACKEND_API_URL');

      expect(value, `${file} must declare BACKEND_API_URL`).toBeTruthy();
      expect(value).toMatch(/\/api$/);
    },
  );

  it('ships the same variable in the committed template, which git does track', () => {
    expect(existsSync(TEMPLATE)).toBe(true);
    expect(readEnvValue(TEMPLATE, 'BACKEND_API_URL')).toMatch(/\/api$/);
  });

  it('resolves the deploy value into the base URL the public routes hang off', () => {
    if (!existsSync(DEPLOY_DEV)) return;

    const configured = readEnvValue(DEPLOY_DEV, 'BACKEND_API_URL');
    const previous = process.env.BACKEND_API_URL;
    process.env.BACKEND_API_URL = configured;
    try {
      expect(`${resolveBackendApiUrl()}/blog/gallery`).toBe(
        `${configured}/blog/gallery`,
      );
    } finally {
      if (previous === undefined) delete process.env.BACKEND_API_URL;
      else process.env.BACKEND_API_URL = previous;
    }
  });
});
