/**
 * Focused tests for the runtime server-only env resolver.
 *
 * Goals:
 * 1. `BACKEND_API_URL` is read at request time (no module-level caching),
 *    so tests can mutate `process.env` and observe a fresh value.
 * 2. Trailing slashes are trimmed.
 * 3. Missing `BACKEND_API_URL` throws a clear, typed error.
 * 4. `VITE_*` variables must NOT be used as a fallback.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { BackendUrlMissingError, resolveBackendApiUrl } from './env';

describe('resolveBackendApiUrl', () => {
  const original = process.env.BACKEND_API_URL;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.BACKEND_API_URL;
    } else {
      process.env.BACKEND_API_URL = original;
    }
  });

  it('returns the value of BACKEND_API_URL at request time', () => {
    process.env.BACKEND_API_URL = 'http://127.0.0.1:9090/api';
    expect(resolveBackendApiUrl()).toBe('http://127.0.0.1:9090/api');
  });

  it('trims trailing slashes from the URL', () => {
    process.env.BACKEND_API_URL = 'http://127.0.0.1:9090/api/';
    expect(resolveBackendApiUrl()).toBe('http://127.0.0.1:9090/api');
  });

  it('trims multiple trailing slashes', () => {
    process.env.BACKEND_API_URL = 'http://127.0.0.1:9090/api///';
    expect(resolveBackendApiUrl()).toBe('http://127.0.0.1:9090/api');
  });

  it('throws a BackendUrlMissingError when BACKEND_API_URL is unset', () => {
    delete process.env.BACKEND_API_URL;
    // Assert the error class and the human-readable message in two
    // unconditional expects so `no-conditional-expect` is satisfied.
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
    expect(() => resolveBackendApiUrl()).toThrow(/BACKEND_API_URL/);
  });

  it('treats an empty string as missing', () => {
    process.env.BACKEND_API_URL = '';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('treats a whitespace-only string as missing after trim', () => {
    process.env.BACKEND_API_URL = '   ';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('does not read any VITE_* fallback', () => {
    delete process.env.BACKEND_API_URL;
    process.env.VITE_SERVER_URL = 'http://example.invalid';
    process.env.VITE_API_URL = 'http://example.invalid';
    expect(() => resolveBackendApiUrl()).toThrow(BackendUrlMissingError);
  });

  it('reads the value fresh on every call (no module-level caching)', () => {
    process.env.BACKEND_API_URL = 'http://first.local/api';
    expect(resolveBackendApiUrl()).toBe('http://first.local/api');
    process.env.BACKEND_API_URL = 'http://second.local/api';
    expect(resolveBackendApiUrl()).toBe('http://second.local/api');
  });
});

describe('BackendUrlMissingError', () => {
  it('is an Error subclass with a stable name and code', () => {
    const err = new BackendUrlMissingError();
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('BackendUrlMissingError');
    expect(err.code).toBe('BackendUrlMissingError');
    expect(err.message).toContain('BACKEND_API_URL');
  });
});
