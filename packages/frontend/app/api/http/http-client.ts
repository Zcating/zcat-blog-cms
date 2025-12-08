import Cookies from 'js-cookie';
import { createQueryPath } from './http-utils';

export namespace HttpClient {
  export const STATIC_URL: string = import.meta.env.VITE_STATIC_URL;

  const API_URL: string = import.meta.env.VITE_API_URL;

  interface ResponseResult {
    code: string;
    message: string;
    data: any;
  }

  export function saveToken(token: string) {
    Cookies.set('token', `Bearer ${token}`);
  }

  export async function post<T = any>(
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

    const response = await fetch(`${API_URL}/${path}`, {
      method: 'POST',
      body: bodyData,
      headers: headers,
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function get<T>(
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const response = await fetch(`${API_URL}/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function put(
    path: string,
    body: Record<string, any>,
  ): Promise<any> {
    const response = await fetch(`${API_URL}/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        Authorization: Cookies.get('token') || '',
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function del(
    path: string,
    body?: Record<string, any>,
  ): Promise<any> {
    const queryPath = createQueryPath(path, body);
    const response = await fetch(`${API_URL}/${queryPath}`, {
      method: 'DELETE',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function serverSideGet<T>(
    path: string,
    body?: Record<string, any>,
  ): Promise<T> {
    const queryPath = createQueryPath(path, body);
    const response = await fetch(`localhost:9090/${queryPath}`, {
      method: 'GET',
      headers: {
        Authorization: Cookies.get('token') || '',
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
    return result.data;
  }
}
