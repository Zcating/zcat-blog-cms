import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { type EnvInventory, scanEnvInventory } from './env-inventory';

const created: string[] = [];

afterEach(() => {
  for (const dir of created.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function fixture(files: Record<string, string>): EnvInventory {
  const root = mkdtempSync(join(tmpdir(), 'env-inventory-'));
  created.push(root);
  for (const [name, content] of Object.entries(files)) {
    const abs = join(root, name);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content, 'utf8');
  }
  return scanEnvInventory(root);
}

function read(inventory: EnvInventory, name: string) {
  return inventory.reads.find((entry) => entry.name === name);
}

function names(inventory: EnvInventory): string[] {
  return inventory.reads.map((entry) => entry.name);
}

const THROWING_ACCESSOR = `
function required(key: string): string {
  const val = process.env[key];
  if (!val) {
    throw new Error(\`Missing required environment variable: \${key}\`);
  }
  return val;
}
`;

const DEFAULTING_ACCESSOR = `
function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}
`;

describe('env-inventory dynamic accessor resolution', () => {
  it('derives a required read whose only trace is a process.env[param] accessor', () => {
    const inventory = fixture({
      'config.service.ts': `${THROWING_ACCESSOR}
export const config = Object.freeze({
  jwtSecret: required('FIXTURE_REQUIRED_TOKEN'),
});
`,
    });

    const entry = read(inventory, 'FIXTURE_REQUIRED_TOKEN');
    expect(entry).toBeDefined();
    expect(entry?.obligation).toBe('required');
    expect([...(entry?.paths ?? [])]).toContain('dynamic-wrapper');
  });

  it('derives a defaulted read whose only trace is a process.env[param] accessor', () => {
    const inventory = fixture({
      'config.service.ts': `${DEFAULTING_ACCESSOR}
export const port = optional('FIXTURE_DEFAULTED_PORT', '1');
`,
    });

    const entry = read(inventory, 'FIXTURE_DEFAULTED_PORT');
    expect(entry).toBeDefined();
    expect(entry?.obligation).toBe('defaulted');
  });

  it('derives a read at a call site in a different file than the accessor', () => {
    const inventory = fixture({
      'accessor.ts': THROWING_ACCESSOR,
      'consumer.ts': `import { required } from './accessor';
export const config = { secret: required('FIXTURE_CROSS_FILE_SECRET') };
`,
    });

    expect(read(inventory, 'FIXTURE_CROSS_FILE_SECRET')?.obligation).toBe(
      'required',
    );
  });

  it('classifies the same accessor as required or defaulted by whether its body throws', () => {
    const inventory = fixture({
      'accessor.ts': THROWING_ACCESSOR,
      'consumer.ts': `${THROWING_ACCESSOR}
export const a = required('FIXTURE_BODY_THROWS');
`,
    });

    expect(read(inventory, 'FIXTURE_BODY_THROWS')?.obligation).toBe('required');
  });

  it('reports a non-literal argument to a dynamic accessor instead of skipping it', () => {
    const inventory = fixture({
      'config.service.ts': `${THROWING_ACCESSOR}
const computed = 'FIXTURE_INDIRECT';
export const config = { token: required(computed) };
`,
    });

    expect(
      inventory.unresolved.map((entry) => entry.reason).join(' | '),
    ).toContain('is not a string literal');
  });

  it('reports a dynamic accessor that no literal call site reaches', () => {
    const inventory = fixture({
      'config.service.ts': `${THROWING_ACCESSOR}
export const config = { token: required(name) };
`,
    });

    expect(inventory.unresolved.length).toBeGreaterThan(0);
    expect(inventory.unresolved[0]?.manualStep).toContain('env-inventory.ts');
  });
});

describe('env-inventory loader wrapper resolution', () => {
  it('derives a read hidden behind a loadEnv binding', () => {
    const inventory = fixture({
      'vite.config.ts': `import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  return { server: { port: Number(env.FIXTURE_LOADER_PORT) } };
});
`,
    });

    const entry = read(inventory, 'FIXTURE_LOADER_PORT');
    expect(entry).toBeDefined();
    expect([...(entry?.paths ?? [])]).toContain('loader-wrapper');
  });

  it('derives a read behind a loadEnv binding wrapped in a type assertion', () => {
    const inventory = fixture({
      'vite.config.ts': `import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd()) as ImportMetaEnv;
  return { server: { proxy: { target: env.FIXTURE_LOADER_PROXY } } };
});
`,
    });

    expect(names(inventory)).toContain('FIXTURE_LOADER_PROXY');
  });

  it('derives a read destructured out of a loadEnv binding', () => {
    const inventory = fixture({
      'vite.config.ts': `import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const { FIXTURE_LOADER_DESTRUCTURED } = env;
  return { define: { FIXTURE_LOADER_DESTRUCTURED } };
});
`,
    });

    expect(names(inventory)).toContain('FIXTURE_LOADER_DESTRUCTURED');
  });
});

describe('env-inventory file loader resolution', () => {
  it('derives a read hidden behind a binding an env file loader returns', () => {
    const inventory = fixture({
      'push.ts': `function loadEnvConfig(envFile: string): Record<string, string> {
  return {};
}

const envConfig = loadEnvConfig('.env.deploy');
export const host = envConfig.FIXTURE_PUSH_HOST;
`,
    });

    const entry = read(inventory, 'FIXTURE_PUSH_HOST');
    expect(entry).toBeDefined();
    expect([...(entry?.paths ?? [])]).toContain('file-loader');
  });

  it('derives a read destructured out of a file loader binding', () => {
    const inventory = fixture({
      'push.ts': `const envConfig = loadEnvConfig('.env.deploy');
const { FIXTURE_PUSH_USER, FIXTURE_PUSH_DIR: dir } = envConfig;
export const both = [FIXTURE_PUSH_USER, dir];
`,
    });

    expect(names(inventory).sort()).toEqual([
      'FIXTURE_PUSH_DIR',
      'FIXTURE_PUSH_USER',
    ]);
    for (const entry of inventory.reads) {
      expect([...entry.paths]).toContain('file-loader');
    }
  });

  it('keeps a file loader binding apart from the process environment', () => {
    const inventory = fixture({
      'push.ts': `const envConfig = loadEnvConfig('.env.deploy');
export const port = process.env.FIXTURE_PUSH_PORT ?? envConfig.FIXTURE_PUSH_HOST;
`,
    });

    expect([...(read(inventory, 'FIXTURE_PUSH_PORT')?.paths ?? [])]).toEqual([
      'member',
    ]);
    expect([...(read(inventory, 'FIXTURE_PUSH_HOST')?.paths ?? [])]).toEqual([
      'file-loader',
    ]);
  });
});

describe('env-inventory destructuring resolution', () => {
  it('derives reads destructured straight out of process.env', () => {
    const inventory = fixture({
      'reads.ts': `const { FIXTURE_DESTRUCTURED_ONE, FIXTURE_DESTRUCTURED_TWO: renamed } = process.env;
export const both = [FIXTURE_DESTRUCTURED_ONE, renamed];
`,
    });

    const paths = inventory.reads.map((entry) => entry.name).sort();
    expect(paths).toEqual([
      'FIXTURE_DESTRUCTURED_ONE',
      'FIXTURE_DESTRUCTURED_TWO',
    ]);
    for (const entry of inventory.reads) {
      expect([...entry.paths]).toContain('destructured');
    }
  });

  it('derives reads destructured out of import.meta.env', () => {
    const inventory = fixture({
      'reads.ts': `const { VITE_FIXTURE_DESTRUCTURED } = import.meta.env;
export const value = VITE_FIXTURE_DESTRUCTURED;
`,
    });

    expect(names(inventory)).toContain('VITE_FIXTURE_DESTRUCTURED');
  });
});

describe('env-inventory env provider resolution', () => {
  it('derives a read hidden behind an env provider import', () => {
    const inventory = fixture({
      'prisma.config.ts': `import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  datasource: { url: env('FIXTURE_PROVIDER_URL') },
});
`,
    });

    const entry = read(inventory, 'FIXTURE_PROVIDER_URL');
    expect(entry).toBeDefined();
    expect(entry?.obligation).toBe('required');
  });
});

describe('env-inventory refusal to pass silently', () => {
  it('reports a non-VITE import.meta.env read instead of ignoring it', () => {
    const inventory = fixture({
      'reads.ts': `export const flag = import.meta.env.FIXTURE_NOT_VITED;
`,
    });

    expect(inventory.reads).toHaveLength(0);
    expect(inventory.unresolved).toHaveLength(1);
    expect(inventory.unresolved[0]?.reason).toContain('VITE_');
    expect(inventory.unresolved[0]?.manualStep).toContain('VITE_');
  });

  it('accepts a Vite built-in read without inventing a deployment variable', () => {
    const inventory = fixture({
      'reads.ts': `export const flag = import.meta.env.DEV;
`,
    });

    expect(inventory.reads).toHaveLength(0);
    expect(inventory.unresolved).toHaveLength(0);
  });

  it('reports a computed process.env key instead of skipping it', () => {
    const inventory = fixture({
      'reads.ts': `export const value = process.env[\`FIXTURE_\${1}\`];
`,
    });

    expect(inventory.reads).toHaveLength(0);
    expect(inventory.unresolved[0]?.reason).toContain('dynamic read');
  });
});

describe('env-inventory noise rejection', () => {
  it('ignores commented-out and template-literal mentions of the environment', () => {
    const inventory = fixture({
      'reads.ts': `// export const a = process.env.FIXTURE_COMMENTED;
/* export const b = process.env.FIXTURE_BLOCK_COMMENTED; */
export const label = \`see process.env.FIXTURE_TEMPLATED for details\`;
export const real = process.env.FIXTURE_REAL;
`,
    });

    expect(names(inventory)).toEqual(['FIXTURE_REAL']);
    expect(inventory.unresolved).toHaveLength(0);
  });

  it('still derives a read that lives inside a template interpolation', () => {
    const inventory = fixture({
      'reads.ts': `export const url = \`\${process.env.FIXTURE_INTERPOLATED}/api\`;
`,
    });

    expect(names(inventory)).toEqual(['FIXTURE_INTERPOLATED']);
  });
});
