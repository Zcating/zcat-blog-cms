import type { Route } from './+types/auth-bff.login';

interface BackendLoginResult {
  code: string;
  message: string;
  data?: { accessToken: string };
}

function resolveBackendBaseUrl(request: Request): string | null {
  const backendApiBaseUrl =
    process.env.VITE_SERVER_URL ?? import.meta.env.VITE_SERVER_URL;
  if (!backendApiBaseUrl) {
    return null;
  }
  return backendApiBaseUrl.replace(/\/+$/, '');
}

export async function action({ request }: Route.ActionArgs) {
  const backendUrl = resolveBackendBaseUrl(request);
  if (!backendUrl) {
    return new Response('Missing VITE_SERVER_URL', { status: 500 });
  }

  const rawBody = await request.json();
  const body = rawBody as Record<string, unknown>;
  const response = await fetch(`${backendUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const rawResult = await response.json();
  const result = rawResult as BackendLoginResult;

  // If login failed, pass through the error
  if (result.code !== '0000') {
    return Response.json(result, { status: 200 });
  }

  // Login succeeded — set httpOnly cookie with Bearer token
  const token = `Bearer ${result.data!.accessToken}`;

  return new Response(JSON.stringify({ code: '0000', message: '登录成功' }), {
    status: 200,
    headers: {
      'Set-Cookie': `token=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/`,
      'Content-Type': 'application/json',
    },
  });
}
