import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface UploadConfigResult {
    presignedUrl: string;
  }
  export function getUploadUrl(type: 'article' | 'photo', key: string) {
    return HttpClient.get<UploadConfigResult>(
      'cms/system-setting/upload-config',
      { type, key },
    );
  }
}
