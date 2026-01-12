import Cookies from 'js-cookie';

import { HttpClientEventCenter } from './http-client-event-center';
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
    return HttpClientEventCenter.subscribe('UNAUTH', callback);
  }

  export function subscribeErrorEvent(callback: () => void) {
    return HttpClientEventCenter.subscribe('ERROR', callback);
  }

  async function fetchFrom(input: string | URL | Request, init?: RequestInit) {
    const response = await fetch(input, init);
    if (response.status === 401) {
      HttpClientEventCenter.emitEvent('UNAUTH');
    }
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      HttpClientEventCenter.emitEvent('ERROR');
      throw new Error(result.message);
    }

    return result;
  }
}
