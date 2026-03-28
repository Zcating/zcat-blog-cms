import Cookies from 'js-cookie';

import { EventCenter } from './event-center';
import { createQueryPath } from './http-utils';

interface RetryOptions {
  retries: number;
  retryDelay: number;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  retries: 3,
  retryDelay: 1000,
};

let csrfToken: string | null = null;

export const csrf = {
  get: () => csrfToken,
  set: (token: string) => {
    csrfToken = token;
  },
  clear: () => {
    csrfToken = null;
  },
};

export namespace HttpClient {
  const API_URL: string = import.meta.env.VITE_API_URL;
  const SERVER_URL: string = import.meta.env.VITE_SERVER_URL;

  interface ResponseResult<T = unknown> {
    code: string;
    message: string;
    data: T;
  }

  export function saveToken(token: string) {
    Cookies.set('token', `Bearer ${token}`);
  }

  export function createAbortController(): AbortController {
    return new AbortController();
  }

  function getCsrfHeader(): Record<string, string> {
    if (csrfToken) {
      return { 'X-CSRF-Token': csrfToken };
    }
    return {};
  }

  async function fetchWithRetry(
    input: string | URL | Request,
    init?: RequestInit & { retryOptions?: RetryOptions },
  ): Promise<Response> {
    const { retryOptions = DEFAULT_RETRY_OPTIONS } = init || {};
    const { retries, retryDelay } = retryOptions;

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(input, init);
        if (response.ok || attempt === retries) {
          return response;
        }
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        if (attempt < retries) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastError || new Error('Request failed');
  }

  export async function post<T = Record<string, any>>(
    path: string,
    body: Record<string, any> | FormData,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    log('POST request', path, body);
    const headers = new Headers({
      Authorization: Cookies.get('token') || '',
      ...getCsrfHeader(),
    });
    let bodyData: string | FormData;
    if (body instanceof FormData) {
      bodyData = body;
    } else {
      bodyData = JSON.stringify(body);
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetchWithRetry(`${API_URL}/${path}`, {
      method: 'POST',
      body: bodyData,
      headers: headers,
      signal: options.signal,
    });
    const result = await handleResponse<T>(response);
    log('POST response', path, result);
    return result;
  }

  export async function get<T = Record<string, string>>(
    path: string,
    body?: Record<string, any>,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const response = await fetchWithRetry(`${API_URL}/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
      signal: options.signal,
    });
    return handleResponse<T>(response);
  }

  export async function put<T = Record<string, any>>(
    path: string,
    body: Record<string, any>,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    const response = await fetchWithRetry(`${API_URL}/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cookies.get('token') || '',
        ...getCsrfHeader(),
      },
      signal: options.signal,
    });
    return handleResponse<T>(response);
  }

  export async function del<T = Record<string, any>>(
    path: string,
    body?: Record<string, any>,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    const queryPath = body
      ? `${path}?${new URLSearchParams(body as Record<string, string>).toString()}`
      : path;
    const response = await fetchWithRetry(`${API_URL}/${queryPath}`, {
      method: 'DELETE',
      headers: {
        Authorization: Cookies.get('token') || '',
        ...getCsrfHeader(),
      },
      signal: options.signal,
    });
    return handleResponse<T>(response);
  }

  export async function serverSideGet<T>(
    path: string,
    body?: Record<string, any>,
    options: { signal?: AbortSignal } = {},
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const response = await fetchWithRetry(`${SERVER_URL}/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
      signal: options.signal,
    });
    return handleResponse<T>(response);
  }

  export function subscribeUnauthEvent(callback: () => void) {
    return EventCenter.subscribe('UNAUTH', callback);
  }

  export function subscribeErrorEvent(callback: (error: Error) => void) {
    return EventCenter.subscribe('ERROR', callback);
  }

  async function handleResponse<T>(response: Response): Promise<T> {
    if (response.status === 401) {
      EventCenter.emitEvent('UNAUTH', new Error('UNAUTH'));
    }
    const result = (await response.json()) as ResponseResult<T>;
    if (result.code !== '0000') {
      EventCenter.emitEvent('ERROR', new Error(result.message));
      throw new Error(result.message);
    }

    return result.data;
  }
}

function log(...args: any[]) {
  if (!import.meta.env.DEV) {
    return;
  }
  console.log(...args);
}
