import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface UploadConfigResult {
    presignedUrl: string;
  }
  export function getUploadUrl(key: string) {
    return HttpClient.get<UploadConfigResult>(
      'cms/system-setting/upload-config',
      { key },
    );
  }
}
