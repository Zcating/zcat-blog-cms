import { createQueryPath } from "./http-utils";

export namespace HttpClient {
  interface ResponseResult {
    code: string;
    message: string;
    data: any;
  }

  export async function get<T = any>(
    path: string,
    params?: Record<string, any>,
  ) {
    const queryPath = createQueryPath(path, params);
    const response = await fetch(`/api/${queryPath}`);
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data as T;
  }

  export async function post<T>(path: string, body: unknown) {
    const response = await fetch(`/api/${path}`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data as T;
  }
}
