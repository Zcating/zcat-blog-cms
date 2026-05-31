import { type ApiError, mapResultCodeToTag } from '../errors';

type ApiResult = { code: string; message: string };

export namespace AuthApi {
  export interface LoginParams {
    username: string;
    password: string;
  }

  export interface LoginResponse {
    token: string;
  }

  export interface RegisterParams {
    username: string;
    password: string;
    email: string;
  }

  export interface RegisterResponse {
    token: string;
  }

  export interface UserInfoResponse {
    username: string;
    email: string;
  }

  function throwIfError(result: ApiResult): void {
    if (result.code !== '0000') {
      const tag = mapResultCodeToTag(result.code);
      throw {
        _tag: tag ?? 'UnknownError',
        message: result.message,
      } satisfies ApiError;
    }
  }

  export async function login(params: LoginParams) {
    const response = await fetch('/api/auth-bff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result: ApiResult = await response.json();
    throwIfError(result);
  }

  export async function logout() {
    const response = await fetch('/api/auth-bff/logout', {
      method: 'POST',
    });
    const result: ApiResult = await response.json();
    throwIfError(result);
  }

  export async function register(params: RegisterParams) {
    const response = await fetch('/api/auth-bff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result: ApiResult = await response.json();
    throwIfError(result);
  }
}
