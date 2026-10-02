import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveBackendApiUrl } from './env';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('blog deploy environment contract', () => {
  it('resolves the deploy value into the base URL the public routes hang off', () => {
    const configured = 'http://backend.local/api';
    vi.stubEnv('BACKEND_API_URL', configured);

    expect(`${resolveBackendApiUrl()}/blog/gallery`).toBe(
      `${configured}/blog/gallery`,
    );
  });
});
