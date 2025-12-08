import { safeParse } from '@cms/components';
import { HttpClient } from '../http';

export namespace UserApi {
  export interface Contact {
    email: string;
    github: string;
  }

  export interface UserInfo {
    id: string;
    name: string;
    contact: Contact;
    occupation: string;
    avatar: string;
    aboutMe: string;
    abstract: string;
  }

  export async function userInfo(): Promise<UserInfo> {
    const result = await HttpClient.get<Record<string, string>>(
      'cms/user-info',
    );
    return {
      id: result.id,
      name: result.name,
      contact: safeParse<Contact>(result.contact, { email: '', github: '' }),
      occupation: result.occupation,
      avatar: result.avatar,
      aboutMe: result.aboutMe,
      abstract: result.abstract,
    };
  }

  export interface UpdateUserInfoParams extends Partial<UserInfo> {}

  export async function updateUserInfo(data: UpdateUserInfoParams) {
    const result = await HttpClient.post('cms/user-info/update', {
      ...data,
      contact: JSON.stringify(data.contact),
    });

    return {
      id: result.id,
      name: result.name,
      contact: safeParse<Contact>(result.contact, { email: '', github: '' }),
      occupation: result.occupation,
      avatar: result.avatar,
      aboutMe: result.aboutMe,
      abstract: result.abstract,
    };
  }
}
