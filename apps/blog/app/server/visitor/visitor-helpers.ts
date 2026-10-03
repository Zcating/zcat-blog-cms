import { resolveBackendApiUrl } from '@blog/server/env';
import type { BackendEnv, FetchLike } from '@blog/server/transport';

export interface ForwardVisitOptions {
  env?: BackendEnv;
  fetch?: FetchLike;
}

const defaultFetch: FetchLike = (input, init) => fetch(input, init);

const defaultEnv: BackendEnv = { resolveBaseUrl: resolveBackendApiUrl };

// 只有载荷校验和与访客 IP 属于这条请求的语义，其余头由后端自行判定。
const FORWARDED_HEADERS = ['data-hash', 'x-forwarded-for', 'x-real-ip'];

const BODYLESS_METHODS = ['GET', 'HEAD'];

/**
 * 把客户端表示（博客同源的 /api 挂载）转发到服务端表示（BACKEND_API_URL），
 * 后端的响应原样返回，因此访客记录的契约仍由后端单点定义。
 */
export async function forwardVisitRequest(
  request: Request,
  options: ForwardVisitOptions = {},
): Promise<Response> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const env = options.env ?? defaultEnv;
  const url = `${env.resolveBaseUrl()}/blog/visitor`;

  const headers: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers[name] = value;
    }
  }

  const withBody = !BODYLESS_METHODS.includes(request.method);
  if (withBody) {
    headers['content-type'] =
      request.headers.get('content-type') ?? 'application/json';
  }

  return fetchImpl(url, {
    method: request.method,
    headers,
    ...(withBody ? { body: await request.text() } : {}),
  });
}
