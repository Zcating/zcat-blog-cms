/**
 * TanStack Start server-function boundary for auth operations.
 *
 * Phase 1: exposes login/logout as public server functions that:
 * - POST directly to the backend /auth/login and /auth/logout endpoints
 * - Manage the HttpOnly `token` cookie (name: `token`, value: `Bearer <token>`)
 * - Never route through /api/bff/*
 */

import { z } from 'zod';
import { createServerFn } from '@tanstack/react-start';
import {
  deleteCookie,
  getCookie,
  setCookie,
} from '@tanstack/start-server-core';

import { mapResultCodeToTag, type ApiError } from '@cms/api/errors';

// ---------------------------------------------------------------------------
// Input schema
// ---------------------------------------------------------------------------

const LoginInputSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

type LoginInput = z.infer<typeof LoginInputSchema>;

// ---------------------------------------------------------------------------
// Backend URL resolution (server-only runtime env)
// ---------------------------------------------------------------------------

function resolveBackendBaseUrl(): string {
  const env =
    typeof process !== 'undefined' ? process.env.BACKEND_API_URL : undefined;
  if (!env) {
    throw new Error('Missing BACKEND_API_URL environment variable');
  }
  return env.replace(/\/+$/, '');
}

// ---------------------------------------------------------------------------
// Cookie constants
// ---------------------------------------------------------------------------

const COOKIE_NAME = 'token';

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  path: '/',
} as const;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function extractBearerToken(): string | null {
  const raw = getCookie(COOKIE_NAME);
  if (!raw) return null;
  return raw.startsWith('Bearer ') ? raw.slice(7) : raw;
}

function throwOnError(result: { code: string; message: string }): never {
  const tag = mapResultCodeToTag(result.code);
  const error: ApiError =
    tag !== null
      ? { _tag: tag, message: result.message }
      : { _tag: 'UnknownError', message: result.message };
  throw error;
}

// ---------------------------------------------------------------------------
// Raw handler: login
// ---------------------------------------------------------------------------

async function loginHandler(input: LoginInput): Promise<{
  code: string;
  message: string;
}> {
  const backendUrl = resolveBackendBaseUrl();
  const response = await fetch(`${backendUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

  const result = (await response.json()) as {
    code: string;
    message: string;
    data?: { accessToken: string };
  };

  if (result.code !== '0000') {
    throwOnError(result);
  }

  // Set the HttpOnly cookie with Bearer token
  setCookie(COOKIE_NAME, `Bearer ${result.data!.accessToken}`, COOKIE_OPTIONS);

  return { code: '0000', message: '登录成功' };
}

// ---------------------------------------------------------------------------
// Raw handler: logout
// ---------------------------------------------------------------------------

async function logoutHandler(): Promise<{
  code: string;
  message: string;
}> {
  const backendUrl = resolveBackendBaseUrl();
  const token = extractBearerToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Call backend logout to remove from whitelist; ignore errors
  await fetch(`${backendUrl}/auth/logout`, {
    method: 'POST',
    headers,
  }).catch(() => {});

  // Clear the token cookie
  deleteCookie(COOKIE_NAME, { ...COOKIE_OPTIONS, maxAge: 0 });

  return { code: '0000', message: '已登出' };
}

// ---------------------------------------------------------------------------
// Server function: login (Fetcher wrapper)
// ---------------------------------------------------------------------------

export const login = createServerFn({ method: 'POST' })
  .validator((data: unknown): LoginInput => LoginInputSchema.parse(data))
  .handler(async ({ data }) => {
    return loginHandler(data);
  });

// ---------------------------------------------------------------------------
// Server function: logout (Fetcher wrapper)
// ---------------------------------------------------------------------------

export const logout = createServerFn({ method: 'POST' }).handler(async () => {
  return logoutHandler();
});
