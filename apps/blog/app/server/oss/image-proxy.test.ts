import { describe, expect, it, vi } from 'vitest';

import { proxyOssImage } from './index';

const OSS_INTERNAL = 'http://oss:9000';

function makeFetch(
  responder: (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => Response | Promise<Response>,
) {
  return vi.fn(responder) as unknown as typeof fetch;
}

function proxyRequest(path?: string) {
  const url =
    path === undefined
      ? 'http://blog.local/api/oss/image'
      : `http://blog.local/api/oss/image?path=${encodeURIComponent(path)}`;
  return new Request(url);
}

const env = { resolveInternalUrl: () => OSS_INTERNAL };

function binaryResponse(
  body: string,
  headers: Record<string, string> = {},
  status = 200,
) {
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'image/png', ...headers },
  });
}

describe('proxyOssImage', () => {
  it('streams the object back with its content type and a private cache window', async () => {
    let captured = '';
    const fetchImpl = makeFetch((input) => {
      captured = String(input);
      return binaryResponse('png-bytes');
    });

    const response = await proxyOssImage(
      proxyRequest('/pictures/user/avatar.png'),
      { env, fetch: fetchImpl },
    );

    expect(captured).toBe(`${OSS_INTERNAL}/pictures/user/avatar.png`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe('private, max-age=300');
    expect(await response.text()).toBe('png-bytes');
  });

  it('refuses to follow a redirect, which is the other way out of the fixed host', async () => {
    const fetchImpl = makeFetch(() => {
      throw new TypeError('redirect');
    });

    const response = await proxyOssImage(
      proxyRequest('/pictures/user/avatar.png'),
      { env, fetch: fetchImpl },
    );

    expect(response.status).toBe(502);
  });

  it('reports an unreachable upstream as a bad gateway', async () => {
    const fetchImpl = makeFetch(() => {
      throw new TypeError('fetch failed');
    });

    const response = await proxyOssImage(
      proxyRequest('/pictures/user/avatar.png'),
      { env, fetch: fetchImpl },
    );

    expect(response.status).toBe(502);
  });

  it('passes the upstream status through instead of masking a missing object', async () => {
    const fetchImpl = makeFetch(() =>
      binaryResponse('not found', { 'Content-Type': 'application/xml' }, 404),
    );

    const response = await proxyOssImage(
      proxyRequest('/pictures/user/gone.png'),
      {
        env,
        fetch: fetchImpl,
      },
    );

    expect(response.status).toBe(404);
  });

  it('rejects a request without path', async () => {
    const fetchImpl = makeFetch(() => binaryResponse('should not happen'));

    const response = await proxyOssImage(proxyRequest(), {
      env,
      fetch: fetchImpl,
    });

    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it.each([
    ['a relative path', 'pictures/user/avatar.png'],
    ['a protocol relative path', '//169.254.169.254/latest/meta-data/'],
    ['a backslash path', '/pictures\\user\\avatar.png'],
    [
      'an absolute url smuggled into the path',
      'http://169.254.169.254/latest/',
    ],
  ])('rejects %s', async (_label, path) => {
    const fetchImpl = makeFetch(() => binaryResponse('should not happen'));

    const response = await proxyOssImage(proxyRequest(path), {
      env,
      fetch: fetchImpl,
    });

    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('rejects a traversal that normalises out of the configured base path', async () => {
    const fetchImpl = makeFetch(() => binaryResponse('should not happen'));

    const response = await proxyOssImage(
      proxyRequest('/pictures/../../secret'),
      {
        env: { resolveInternalUrl: () => `${OSS_INTERNAL}/pictures` },
        fetch: fetchImpl,
      },
    );

    expect(response.status).toBe(400);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('keeps a traversal that stays inside the origin on that origin', async () => {
    let captured = '';
    const fetchImpl = makeFetch((input) => {
      captured = String(input);
      return binaryResponse('png-bytes');
    });

    await proxyOssImage(proxyRequest('/pictures/../../secret'), {
      env,
      fetch: fetchImpl,
    });

    expect(new URL(captured).origin).toBe(OSS_INTERNAL);
  });

  it('fails closed with a 500 when the internal address is not configured', async () => {
    const fetchImpl = makeFetch(() => binaryResponse('should not happen'));

    const response = await proxyOssImage(
      proxyRequest('/pictures/user/avatar.png'),
      { env: { resolveInternalUrl: () => 'not-a-url' }, fetch: fetchImpl },
    );

    expect(response.status).toBe(500);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('forwards no client headers to the object storage', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedInit = init;
      return binaryResponse('png-bytes');
    });

    await proxyOssImage(
      new Request(
        `http://blog.local/api/oss/image?path=${encodeURIComponent('/pictures/user/avatar.png')}`,
        { headers: { Cookie: 'session=secret', 'X-Forwarded-For': '1.2.3.4' } },
      ),
      { env, fetch: fetchImpl },
    );

    expect(capturedInit?.headers).toBeUndefined();
  });
});
