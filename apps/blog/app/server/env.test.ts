import { afterEach, describe, expect, it } from 'vitest';

import { BackendUrlMissingError, resolveBackendApiUrl } from './env';

const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;

afterEach(() => {
  if (ORIGINAL_BACKEND_URL === undefined) {
    delete process.env.BACKEND_API_URL;
  } else {
    process.env.BACKEND_API_URL = ORIGINAL_BACKEND_URL;
  }
});

describe('resolveBackendApiUrl', () => {
  it('returns the configured base URL', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('throws BackendUrlMissingError when the variable is absent', () => {
    delete process.env.BACKEND_API_URL;
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('throws BackendUrlMissingError when the variable is an empty string', () => {
    process.env.BACKEND_API_URL = '';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('throws BackendUrlMissingError when the variable is whitespace only', () => {
    process.env.BACKEND_API_URL = '   \t\n  ';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('strips a single trailing slash', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api/';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('strips repeated trailing slashes', () => {
    process.env.BACKEND_API_URL = 'http://backend.local/api///';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('trims surrounding whitespace before stripping the slash', () => {
    process.env.BACKEND_API_URL = '  http://backend.local/api/  ';
    expect(resolveBackendApiUrl()).toBe('http://backend.local/api');
  });

  it('keeps a bare host without a path intact', () => {
    process.env.BACKEND_API_URL = 'http://backend.local:9090';
    expect(resolveBackendApiUrl()).toBe('http://backend.local:9090');
  });

  it('reads fresh on every call with no module-level caching', () => {
    process.env.BACKEND_API_URL = 'http://first.local/api';
    expect(resolveBackendApiUrl()).toBe('http://first.local/api');

    process.env.BACKEND_API_URL = 'http://second.local/api';
    expect(resolveBackendApiUrl()).toBe('http://second.local/api');

    delete process.env.BACKEND_API_URL;
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('exposes a stable error code and name', () => {
    delete process.env.BACKEND_API_URL;

    let caught: unknown;
    try {
      resolveBackendApiUrl();
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BackendUrlMissingError);
    expect(caught).toMatchObject({
      code: 'BackendUrlMissingError',
      name: 'BackendUrlMissingError',
    });
  });
});
