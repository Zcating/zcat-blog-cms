import { resolveOssInternalUrl } from '@blog/server/env';
import type { FetchLike } from '@blog/server/transport';

export interface OssEnv {
  resolveInternalUrl: () => string;
}

export interface ProxyOssImageOptions {
  env?: OssEnv;
  fetch?: FetchLike;
}

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

const defaultEnv: OssEnv = { resolveInternalUrl: resolveOssInternalUrl };

const UPSTREAM_TIMEOUT = 5000;

function badRequest(reason: string) {
  return new Response(reason, {
    status: 400,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}

export async function proxyOssImage(
  request: Request,
  options: ProxyOssImageOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const env = options.env ?? defaultEnv;

  const path = new URL(request.url).searchParams.get('path');
  if (!path) {
    return badRequest('path is required');
  }
  if (
    !path.startsWith('/') ||
    path.startsWith('//') ||
    path.includes('\\') ||
    path.includes('://')
  ) {
    return badRequest('path must be an absolute object path');
  }

  let base: URL;
  let target: URL;
  try {
    const internalUrl = env.resolveInternalUrl();
    base = new URL(internalUrl);
    target = new URL(`${internalUrl}${path}`);
  } catch {
    return new Response('oss internal url is not configured', { status: 500 });
  }

  const basePath = base.pathname.endsWith('/')
    ? base.pathname
    : `${base.pathname}/`;

  if (target.origin !== base.origin || !target.pathname.startsWith(basePath)) {
    return badRequest('path leaves the configured object storage');
  }

  let upstream: Response;
  try {
    upstream = await fetchImpl(target.href, {
      redirect: 'error',
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT),
    });
  } catch {
    return new Response('oss upstream is unreachable', { status: 502 });
  }

  if (!upstream.ok) {
    return new Response('oss upstream error', { status: upstream.status });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type':
        upstream.headers.get('content-type') ?? 'application/octet-stream',
      'cache-control': 'private, max-age=300',
    },
  });
}
