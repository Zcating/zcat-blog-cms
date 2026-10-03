import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BackendUrlMissingError } from '@blog/server/env';

import { forwardVisitRequest } from './index';

const ORIGINAL_BACKEND_URL = process.env.BACKEND_API_URL;

const VISIT_PAYLOAD = {
  pagePath: 'http://blog.invalid/post-board',
  pageTitle: 'Post Board',
  referrer: '',
  browser: 'Chrome 120.0.0.0',
  os: 'Windows',
  device: 'Desktop',
  deviceId: 'fp-1',
};

const PAYLOAD_HASH = 'f2db8c88cc7b5676ba28117960984b3e';

function makeFetch(
  responder: (input: RequestInfo | URL, init?: RequestInit) => Response,
) {
  return vi.fn(responder) as unknown as typeof fetch;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function visitRequest(method: string, headers: Record<string, string> = {}) {
  return new Request('http://blog.invalid/api/blog/visitor', {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Data-Hash': PAYLOAD_HASH,
      ...headers,
    },
    ...(method === 'GET' ? {} : { body: JSON.stringify(VISIT_PAYLOAD) }),
  });
}

beforeEach(() => {
  process.env.BACKEND_API_URL = 'http://backend.local/api';
});

afterEach(() => {
  if (ORIGINAL_BACKEND_URL === undefined) {
    delete process.env.BACKEND_API_URL;
  } else {
    process.env.BACKEND_API_URL = ORIGINAL_BACKEND_URL;
  }
});

describe('forwardVisitRequest', () => {
  it('addresses the visitor endpoint on the server representation of the backend address', async () => {
    let capturedUrl = '';
    const fetchImpl = makeFetch((input) => {
      capturedUrl = String(input);
      return jsonResponse({ code: '0000', message: 'success' });
    });

    await forwardVisitRequest(visitRequest('POST'), { fetch: fetchImpl });

    expect(capturedUrl).toBe('http://backend.local/api/blog/visitor');
  });

  it('replays the browser payload and its checksum so the backend can verify the record', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedInit = init;
      return jsonResponse({ code: '0000', message: 'success' });
    });

    await forwardVisitRequest(visitRequest('POST'), { fetch: fetchImpl });

    expect(capturedInit?.method).toBe('POST');
    expect(capturedInit?.body).toBe(JSON.stringify(VISIT_PAYLOAD));
    expect(new Headers(capturedInit?.headers).get('data-hash')).toBe(
      PAYLOAD_HASH,
    );
    expect(new Headers(capturedInit?.headers).get('content-type')).toBe(
      'application/json',
    );
  });

  it('carries the visitor address headers through and drops the rest', async () => {
    let capturedHeaders: Headers | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedHeaders = new Headers(init?.headers);
      return jsonResponse({ code: '0000', message: 'success' });
    });

    await forwardVisitRequest(
      visitRequest('POST', {
        'X-Forwarded-For': '203.0.113.7',
        'X-Real-IP': '203.0.113.7',
        Cookie: 'session=secret',
        'User-Agent': 'Mozilla/5.0',
      }),
      { fetch: fetchImpl },
    );

    expect(capturedHeaders?.get('x-forwarded-for')).toBe('203.0.113.7');
    expect(capturedHeaders?.get('x-real-ip')).toBe('203.0.113.7');
    expect(capturedHeaders?.get('cookie')).toBeNull();
    expect(capturedHeaders?.get('user-agent')).toBeNull();
  });

  it('forwards a probe without a body, because GET carries no record', async () => {
    let capturedInit: RequestInit | undefined;
    const fetchImpl = makeFetch((_input, init) => {
      capturedInit = init;
      return jsonResponse({ code: '0000', message: 'success' });
    });

    await forwardVisitRequest(visitRequest('GET'), { fetch: fetchImpl });

    expect(capturedInit?.method).toBe('GET');
    expect(capturedInit?.body).toBeUndefined();
  });

  it('hands the backend response back untouched', async () => {
    const backendResponse = jsonResponse(
      { code: '0000', message: 'success', data: { method: 'POST' } },
      200,
    );
    const fetchImpl = makeFetch(() => backendResponse);

    const response = await forwardVisitRequest(visitRequest('GET'), {
      fetch: fetchImpl,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual({
      code: '0000',
      message: 'success',
      data: { method: 'POST' },
    });
  });

  it('does not report a record as accepted when the backend rejects it', async () => {
    const fetchImpl = makeFetch(() =>
      jsonResponse({ code: 'ERR0005', message: '数据验证错误' }, 200),
    );

    const response = await forwardVisitRequest(visitRequest('POST'), {
      fetch: fetchImpl,
    });

    expect((await response.json()).code).toBe('ERR0005');
  });

  it('throws BackendUrlMissingError when BACKEND_API_URL is absent', async () => {
    delete process.env.BACKEND_API_URL;
    const fetchImpl = makeFetch(() => jsonResponse({}));

    await expect(
      forwardVisitRequest(visitRequest('POST'), { fetch: fetchImpl }),
    ).rejects.toBeInstanceOf(BackendUrlMissingError);
  });
});
