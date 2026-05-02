import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface UploadTokenParams {
    type: 'article' | 'photo';
    filename?: string;
  }
  export interface UploadTokenResult {
    uploadToken: string;
  }
  export function getUploadToken(type: 'article' | 'photo', filename?: string) {
    return HttpClient.get<UploadTokenResult>(
      'cms/system-setting/upload-token',
      { type, ...(filename ? { filename } : {}) },
    );
  }
}
