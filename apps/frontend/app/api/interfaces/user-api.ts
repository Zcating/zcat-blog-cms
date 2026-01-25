import { safeParseJson } from '@zcat/ui';

import { HttpClient } from '../http';

export namespace UserApi {
  export interface Contact {
    email: string;
    github: string;
  }

  export interface UserInfo {
    name: string;
    contact: Contact;
    occupation: string;
    avatar: string;
    aboutMe: string;
    abstract: string;
  }

  export async function userInfo(): Promise<UserInfo> {
    const result = await HttpClient.get('cms/user-info');
    return {
      name: result.name,
      contact: safeParseJson<Contact>(result.contact, {
        email: '',
        github: '',
      }),
      occupation: result.occupation,
      avatar: result.avatar,
      aboutMe: result.aboutMe,
      abstract: result.abstract,
    };
  }

  export type UpdateUserInfoParams = Partial<UserInfo>;

  export async function updateUserInfo(data: UpdateUserInfoParams) {
    const result = await HttpClient.post<Record<string, string>>(
      'cms/user-info/update',
      {
        ...data,
        contact: JSON.stringify(data.contact),
      },
    );

    return {
      name: result.name,
      contact: safeParseJson<Contact>(result.contact, {
        email: '',
        github: '',
      }),
      occupation: result.occupation,
      avatar: result.avatar,
      aboutMe: result.aboutMe,
      abstract: result.abstract,
    };
  }
}
