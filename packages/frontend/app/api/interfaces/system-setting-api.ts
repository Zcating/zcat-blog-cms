import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface UploadTokenParams {
    type: 'article' | 'photo';
  }
  export interface UploadTokenResult {
    uploadToken: string;
  }
  export function getUploadToken(type: 'article' | 'photo') {
    return HttpClient.get<UploadTokenResult>(
      'cms/system-setting/upload-token',
      { type },
    );
  }
}
