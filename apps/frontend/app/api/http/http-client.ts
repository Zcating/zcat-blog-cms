import Cookies from 'js-cookie';

import { EventCenter } from './event-center';
import { createQueryPath } from './http-utils';

export namespace HttpClient {
  const API_URL: string = import.meta.env.VITE_API_URL;
  const SERVER_URL: string = import.meta.env.VITE_SERVER_URL;
  interface ResponseResult {
    code: string;
    message: string;
    data: any;
  }

  export function saveToken(token: string) {
    Cookies.set('token', `Bearer ${token}`);
  }

  export async function post<T = Record<string, any>>(
    path: string,
    body: Record<string, any> | FormData,
  ): Promise<T> {
    log('POST request', path, body);
    const headers = new Headers({
      Authorization: Cookies.get('token') || '',
    });
    let bodyData: string | FormData;
    if (body instanceof FormData) {
      bodyData = body;
    } else {
      bodyData = JSON.stringify(body);
      headers.set('Content-Type', 'application/json');
    }

    const result = await fetchFrom(`${API_URL}/${path}`, {
      method: 'POST',
      body: bodyData,
      headers: headers,
    });
    log('POST response', path, result);
    return result.data;
  }

  export async function get<T = Record<string, string>>(
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const result = await fetchFrom(`${API_URL}/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });

    return result.data;
  }

  export async function put(
    path: string,
    body: Record<string, any>,
  ): Promise<any> {
    const result = await fetchFrom(`${API_URL}/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cookies.get('token') || '',
      },
    });

    return result.data;
  }

  export async function del(
    path: string,
    body?: Record<string, any>,
  ): Promise<any> {
    const queryPath = createQueryPath(path, body);
    const result = await fetchFrom(`${API_URL}/${queryPath}`, {
      method: 'DELETE',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });
    return result.data;
  }

  export async function serverSideGet<T>(
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const result = await fetchFrom(`${SERVER_URL}/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });
    return result.data;
  }

  export function subscribeUnauthEvent(callback: () => void) {
    return EventCenter.subscribe('UNAUTH', callback);
  }

  export function subscribeErrorEvent(callback: (error: Error) => void) {
    return EventCenter.subscribe('ERROR', callback);
  }

  async function fetchFrom(input: string | URL | Request, init?: RequestInit) {
    const response = await fetch(input, init);
    if (response.status === 401) {
      EventCenter.emitEvent('UNAUTH', new Error('UNAUTH'));
    }
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      EventCenter.emitEvent('ERROR', new Error(result.message));
      throw new Error(result.message);
    }

    return result;
  }
}

function log(...args: any[]) {
  if (!import.meta.env.DEV) {
    return;
  }
  console.log(...args);
}
