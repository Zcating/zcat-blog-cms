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

  export async function login(params: LoginParams) {
    const response = await fetch('/api/auth-bff/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result: ApiResult = await response.json();
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
  }

  export async function logout() {
    const response = await fetch('/api/auth-bff/logout', {
      method: 'POST',
    });
    const result: ApiResult = await response.json();
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
  }

  export async function register(params: RegisterParams) {
    const response = await fetch('/api/auth-bff/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const result: ApiResult = await response.json();
    if (result.code !== '0000') {
      throw new Error(result.message);
    }
  }
}
