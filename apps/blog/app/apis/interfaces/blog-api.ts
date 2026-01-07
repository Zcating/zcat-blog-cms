import { HttpClient } from "../http/http-client";

export namespace UserApi {
  export interface UserInfo {
    name: string;
    occupation: string;
    abstract: string;
    aboutMe: string;
    contact: {
      email: string;
      github: string;
    };
    avatar: string;
    createdAt: string;
    updatedAt: string;
  }

  /**
   * 获取用户信息
   * @returns {Promise<UserInfo>} 用户信息
   */
  export async function getUserInfo(): Promise<UserInfo> {
    const userInfo = await HttpClient.serverSideGet("blog/user-info");
    return {
      ...userInfo,
      contact: {
        email: userInfo.contact?.email ?? "",
        github: userInfo.contact?.github ?? "",
      },
    };
  }
}
