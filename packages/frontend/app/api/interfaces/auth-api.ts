import { HttpClient } from "../http-client";

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
    const data = await HttpClient.post('/auth/login', params);
    const token = data.accessToken;
    HttpClient.saveToken(token);
  }

  export async function register(params: RegisterParams) {
    const data = await HttpClient.post('/auth/register', params);
    const token = data.accessToken;
    HttpClient.saveToken(token);
  }
}