import Cookies from 'js-cookie';

import { csrfContext } from '../context/csrf-context';
import { getCurrentRequest } from '../context/request-context';

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

export const csrf = {
  get: () => csrfContext.get(),
  set: (token: string | null) => csrfContext.set(token),
  clear: () => csrfContext.set(null),
};

export namespace HttpClient {
  const API_URL: string = '/api/bff';

  interface ResponseResult<T = unknown> {
    code: string;
    message: string;
    data: T;
  }

  type Params = Record<string, any>;
  type BodyParams = Params | FormData;

  interface RequestOptions<TParams = Params> {
    path: string;
    params?: TParams;
    signal?: AbortSignal;
  }

  type RequestSignalOptions = Pick<RequestOptions, 'signal'>;

  export function saveToken(token: string) {
    Cookies.set('token', `Bearer ${token}`, { path: '/' });
  }

  export function createAbortController(): AbortController {
    return new AbortController();
  }

  function getCsrfHeader(): Record<string, string> {
    const token = csrfContext.get();
    if (token) {
      return { 'X-CSRF-Token': token };
    }
    return {};
  }

  function resolveApiUrl(path: string): string {
    const currentRequest = getCurrentRequest();
    if (currentRequest) {
      const origin = new URL(currentRequest.url).origin;
      return `${origin}${API_URL}/${path}`;
    }
    return `${API_URL}/${path}`;
  }

  function isRequestOptions<TParams>(
    value: string | RequestOptions<TParams>,
  ): value is RequestOptions<TParams> {
    return typeof value !== 'string';
  }

  function normalizeRequestOptions<TParams>(
    pathOrOptions: string | RequestOptions<TParams>,
    params?: TParams,
    options: RequestSignalOptions = {},
  ): RequestOptions<TParams> {
    if (isRequestOptions(pathOrOptions)) {
      return pathOrOptions;
    }

    return {
      path: pathOrOptions,
      params,
      signal: options.signal,
    };
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

  export function post<T = Record<string, any>>(
    options: RequestOptions<BodyParams>,
  ): Promise<T>;
  export function post<T = Record<string, any>>(
    path: string,
    params: BodyParams,
    options?: RequestSignalOptions,
  ): Promise<T>;
  export async function post<T = Record<string, any>>(
    pathOrOptions: string | RequestOptions<BodyParams>,
    params?: BodyParams,
    options: RequestSignalOptions = {},
  ): Promise<T> {
    const request = normalizeRequestOptions(pathOrOptions, params, options);
    log('POST request', request.path, request.params);
    const headers: Record<string, string> = {
      ...getCsrfHeader(),
    };
    let bodyData: string | FormData;
    if (request.params instanceof FormData) {
      bodyData = request.params;
    } else {
      bodyData = JSON.stringify(request.params);
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetchWithRetry(resolveApiUrl(request.path), {
      method: 'POST',
      body: bodyData,
      headers: headers,
      signal: request.signal,
    });
    const result = await handleResponse<T>(response);
    log('POST response', request.path, result);
    return result;
  }

  export function get<T = Record<string, string>>(
    options: RequestOptions<Params>,
  ): Promise<T>;
  export function get<T = Record<string, string>>(
    path: string,
    params?: Params,
    options?: RequestSignalOptions,
  ): Promise<T>;
  export async function get<T = Record<string, string>>(
    pathOrOptions: string | RequestOptions<Params>,
    params?: Params,
    options: RequestSignalOptions = {},
  ): Promise<T> {
    const request = normalizeRequestOptions(pathOrOptions, params, options);
    const queryPath = createQueryPath(request.path, request.params);
    const response = await fetchWithRetry(resolveApiUrl(queryPath), {
      method: 'GET',
      signal: request.signal,
    });
    return handleResponse<T>(response);
  }

  export function put<T = Record<string, any>>(
    options: RequestOptions<Params>,
  ): Promise<T>;
  export function put<T = Record<string, any>>(
    path: string,
    params: Params,
    options?: RequestSignalOptions,
  ): Promise<T>;
  export async function put<T = Record<string, any>>(
    pathOrOptions: string | RequestOptions<Params>,
    params?: Params,
    options: RequestSignalOptions = {},
  ): Promise<T> {
    const request = normalizeRequestOptions(pathOrOptions, params, options);
    const response = await fetchWithRetry(resolveApiUrl(request.path), {
      method: 'PUT',
      body: JSON.stringify(request.params),
      headers: {
        'Content-Type': 'application/json',
        ...getCsrfHeader(),
      },
      signal: request.signal,
    });
    return handleResponse<T>(response);
  }

  export function del<T = Record<string, any>>(
    options: RequestOptions<Params>,
  ): Promise<T>;
  export function del<T = Record<string, any>>(
    path: string,
    params?: Params,
    options?: RequestSignalOptions,
  ): Promise<T>;
  export async function del<T = Record<string, any>>(
    pathOrOptions: string | RequestOptions<Params>,
    params?: Params,
    options: RequestSignalOptions = {},
  ): Promise<T> {
    const request = normalizeRequestOptions(pathOrOptions, params, options);
    const queryPath = createQueryPath(request.path, request.params);
    const response = await fetchWithRetry(resolveApiUrl(queryPath), {
      method: 'DELETE',
      headers: {
        ...getCsrfHeader(),
      },
      signal: request.signal,
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
