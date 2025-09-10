import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface UploadToken {
    uploadToken: string;
  }
  export function getUploadToken() {
    return HttpClient.get<UploadToken>('cms/system-setting/upload-token');
  }
}
