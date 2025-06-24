import Cookies from "js-cookie";

export namespace HttpClient {
  interface ResponseResult {
    code: string;
    message: string;
    data: any;
  }

  export function saveToken(token: string) {
    Cookies.set("token", `Bearer ${token}`);
  }

  export async function post(path: string, body: Record<string, any>): Promise<any> {
    const response = await fetch(`/api/${path}`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: Cookies.get("token") || "",
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function get(path: string, body?: Record<string, any>): Promise<any> {
    if (body) {
      path += "?" + new URLSearchParams(body).toString();
    }
    const response = await fetch(`/api/${path}`, {
      method: "GET",
      headers: {
        Authorization: Cookies.get("token") || "",
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function put(path: string, body: Record<string, any>): Promise<any> {
    const response = await fetch(`/api/${path}`, {
      method: "PUT",
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        Authorization: Cookies.get("token") || "",
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function del(path: string, body?: Record<string, any>): Promise<any> {
    if (body) {
      path += "?" + new URLSearchParams(body).toString();
    }
    const response = await fetch(`/api/${path}`, {
      method: "DELETE",
      headers: {
        Authorization: Cookies.get("token") || "",
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data;
  }

  export async function postWithFile(
    path: string,
    formData: FormData
  ): Promise<any> {
    const response = await fetch(`/api/${path}`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: Cookies.get("token") || "",
      },
    });
    const result = (await response.json()) as ResponseResult;
    if (result.code !== "0000") {
      throw new Error(result.message);
    }
    return result.data;
  }
}
