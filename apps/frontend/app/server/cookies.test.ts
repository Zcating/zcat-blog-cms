/**
 * Focused tests for the public Cookie / session helpers.
 *
 * The helpers wrap `@tanstack/react-start/server`'s Cookie/header APIs and
 * preserve the existing `token` Cookie convention (HttpOnly, `Bearer `-
 * prefixed JWT). They must NOT depend on `@tanstack/start-server-core`
 * directly (per Phase 2a constraints).
 *
 * The shared helpers are pure functions over the TanStack-Start-provided
 * getters/setters; they are exercised by injecting a fake `io` so the
 * tests do not need a live TanStack Start request context.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  authorizeFromCookie,
  clearSessionCookie,
  parseSessionCookie,
  setSessionCookie,
  TOKEN_COOKIE_NAME,
  type CookieIO,
} from './cookies';

function makeIo(overrides: Partial<CookieIO> = {}): {
  io: CookieIO;
  writes: { name: string; value: string; options?: unknown }[];
  deletes: { name: string; options?: unknown }[];
} {
  const writes: { name: string; value: string; options?: unknown }[] = [];
  const deletes: { name: string; options?: unknown }[] = [];
  const io: CookieIO = {
    getCookie: vi.fn(() => undefined),
    setCookie: vi.fn((name, value, options) => {
      writes.push({ name, value, options });
    }),
    deleteCookie: vi.fn((name, options) => {
      deletes.push({ name, options });
    }),
    ...overrides,
  };
  return { io, writes, deletes };
}

describe('TOKEN_COOKIE_NAME', () => {
  it('is the literal "token"', () => {
    expect(TOKEN_COOKIE_NAME).toBe('token');
  });
});

describe('setSessionCookie / clearSessionCookie', () => {
  it('writes the token Cookie with the standard HttpOnly + SameSite=Strict flags', () => {
    const { io, writes } = makeIo();
    setSessionCookie('Bearer abc.def.ghi', io);
    expect(writes).toHaveLength(1);
    expect(writes[0].name).toBe(TOKEN_COOKIE_NAME);
    expect(writes[0].value).toBe('Bearer abc.def.ghi');
    const opts = writes[0].options as {
      httpOnly?: boolean;
      sameSite?: string;
      path?: string;
    };
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe('strict');
    expect(opts.path).toBe('/');
  });

  it('clearSessionCookie deletes the same Cookie and signals expiry via maxAge: 0', () => {
    const { io, deletes } = makeIo();
    clearSessionCookie(io);
    expect(deletes).toHaveLength(1);
    expect(deletes[0].name).toBe(TOKEN_COOKIE_NAME);
    const opts = deletes[0].options as { maxAge?: number };
    expect(opts.maxAge).toBe(0);
  });
});

describe('parseSessionCookie', () => {
  it('returns null when the Cookie is missing', () => {
    const { io } = makeIo();
    expect(parseSessionCookie(io)).toBeNull();
  });

  it('returns null when the Cookie has no value', () => {
    const { io } = makeIo({ getCookie: vi.fn(() => '') });
    expect(parseSessionCookie(io)).toBeNull();
  });

  it('strips a single leading "Bearer " prefix and returns the raw token', () => {
    const { io } = makeIo({ getCookie: vi.fn(() => 'Bearer abc.def.ghi') });
    expect(parseSessionCookie(io)).toBe('abc.def.ghi');
  });

  it('returns the raw Cookie value when there is no Bearer prefix', () => {
    // The legacy "raw token" form must still be honored.
    const { io } = makeIo({ getCookie: vi.fn(() => 'raw-token-only') });
    expect(parseSessionCookie(io)).toBe('raw-token-only');
  });

  it('only strips the FIRST "Bearer " occurrence', () => {
    // Defensive: malformed cookies with repeated prefixes must not be
    // silently re-mangled into nonsense.
    const { io } = makeIo({ getCookie: vi.fn(() => 'Bearer Bearer xyz') });
    expect(parseSessionCookie(io)).toBe('Bearer xyz');
  });
});

describe('authorizeFromCookie', () => {
  it('returns the bearer string when a Bearer-prefixed Cookie is present', () => {
    const { io } = makeIo({ getCookie: vi.fn(() => 'Bearer abc.def.ghi') });
    expect(authorizeFromCookie(io)).toBe('Bearer abc.def.ghi');
  });

  it('re-wraps a raw (non-prefixed) token so downstream callers see "Bearer <token>"', () => {
    const { io } = makeIo({ getCookie: vi.fn(() => 'raw-token-only') });
    expect(authorizeFromCookie(io)).toBe('Bearer raw-token-only');
  });

  it('returns null when there is no Cookie', () => {
    const { io } = makeIo();
    expect(authorizeFromCookie(io)).toBeNull();
  });

  it('returns null when the Cookie value is empty', () => {
    const { io } = makeIo({ getCookie: vi.fn(() => '') });
    expect(authorizeFromCookie(io)).toBeNull();
  });
});
