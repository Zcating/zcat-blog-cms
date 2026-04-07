import type { Route } from './+types/api-bff.$';

const HOP_BY_HOP_HEADERS = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
];

function resolveBackendApiBaseUrl(): string | null {
  const backendApiBaseUrl =
    process.env.VITE_SERVER_URL ?? import.meta.env.VITE_SERVER_URL;
  if (!backendApiBaseUrl) {
    return null;
  }
  return backendApiBaseUrl.replace(/\/+$/, '');
}

function createTargetUrl(request: Request, splatPath: string): string | null {
  const requestUrl = new URL(request.url);
  const normalizedPath = splatPath.replace(/^\/+/, '');
  const backendApiBaseUrl = resolveBackendApiBaseUrl();
  if (!backendApiBaseUrl) {
    return null;
  }
  return `${backendApiBaseUrl}/${normalizedPath}${requestUrl.search}`;
}

function sanitizeRequestHeaders(request: Request): Headers {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }
  return headers;
}

function sanitizeResponseHeaders(response: Response): Headers {
  const headers = new Headers(response.headers);
  for (const headerName of HOP_BY_HOP_HEADERS) {
    headers.delete(headerName);
  }
  return headers;
}

async function proxyToBackend(
  request: Request,
  params: Route.LoaderArgs['params'],
) {
  const splatPath = params['*'];
  if (!splatPath) {
    return new Response('Missing target path', { status: 400 });
  }

  const targetUrl = createTargetUrl(request, splatPath);
  if (!targetUrl) {
    return new Response('Missing VITE_SERVER_URL', { status: 500 });
  }
  const method = request.method.toUpperCase();
  const hasRequestBody = method !== 'GET' && method !== 'HEAD';

  const response = await fetch(targetUrl, {
    method,
    headers: sanitizeRequestHeaders(request),
    body: hasRequestBody ? await request.arrayBuffer() : undefined,
    redirect: 'manual',
    signal: request.signal,
  });

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: sanitizeResponseHeaders(response),
  });
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return proxyToBackend(request, params);
}

export async function action({ request, params }: Route.ActionArgs) {
  return proxyToBackend(request, params);
}
