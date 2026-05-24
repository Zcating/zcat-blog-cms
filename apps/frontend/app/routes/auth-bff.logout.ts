import type { Route } from './+types/auth-bff.logout';

function resolveBackendBaseUrl(): string | null {
  const backendApiBaseUrl =
    process.env.VITE_SERVER_URL ?? import.meta.env.VITE_SERVER_URL;
  if (!backendApiBaseUrl) {
    return null;
  }
  return backendApiBaseUrl.replace(/\/+$/, '');
}

function extractAuthToken(cookieHeader: string): string | null {
  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [key, ...rest] = c.trim().split('=');
      return [decodeURIComponent(key), decodeURIComponent(rest.join('='))];
    }),
  );
  return cookies['token'] || null;
}

export async function action({ request }: Route.ActionArgs) {
  const backendUrl = resolveBackendBaseUrl();
  if (!backendUrl) {
    return new Response('Missing VITE_SERVER_URL', { status: 500 });
  }

  // Extract token from httpOnly cookie, forward to backend as Bearer
  const cookie = request.headers.get('Cookie') || '';
  const token = extractAuthToken(cookie);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }

  // Call backend logout to remove from whitelist; ignore errors
  await fetch(`${backendUrl}/auth/logout`, {
    method: 'POST',
    headers,
  }).catch(() => {});

  // Clear the httpOnly cookie
  return new Response(JSON.stringify({ code: '0000', message: '已登出' }), {
    status: 200,
    headers: {
      'Set-Cookie': 'token=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0',
      'Content-Type': 'application/json',
    },
  });
}
