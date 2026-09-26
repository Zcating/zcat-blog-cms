import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it, vi } from 'vitest';

const VITE_ENV_FILES = ['.env.example', '.env', '.env.development'];

function readViteDevPort(appDir: string): string {
  let port: string | undefined;

  for (const name of VITE_ENV_FILES) {
    const file = fileURLToPath(
      new URL(`../../../../${appDir}/${name}`, import.meta.url),
    );
    if (!existsSync(file)) continue;
    const matched = readFileSync(file, 'utf8').match(
      /^\s*VITE_PORT\s*=\s*(\S+)/m,
    );
    if (matched?.[1]) port = matched[1];
  }

  if (!port) {
    throw new Error(`VITE_PORT not found in any env file of ${appDir}`);
  }

  return port;
}

async function loadDevConfig() {
  vi.resetModules();
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('CORS_ALLOWED_ORIGINS', '');
  vi.stubEnv('ALLOW_REGISTER', undefined);
  const { config } = await import('./config.service');
  return config;
}

describe('config.service', () => {
  it('allows the dev origins the two frontends actually serve on', async () => {
    const config = await loadDevConfig();

    expect(config.corsAllowedOrigins).toContain(
      `http://localhost:${readViteDevPort('apps/frontend')}`,
    );
    expect(config.corsAllowedOrigins).toContain(
      `http://localhost:${readViteDevPort('apps/blog')}`,
    );
  });

  it('has no dev default origin that no frontend serves on', async () => {
    const config = await loadDevConfig();

    expect(config.corsAllowedOrigins).toHaveLength(2);
    expect(config.corsAllowedOrigins).not.toContain('http://localhost:5000');
  });
});
