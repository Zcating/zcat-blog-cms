import { HttpClient } from '../http';

export namespace SystemSettingApi {
  export interface OssConfig {
    accessKey: string;
    secretKey: string;
  }
  export interface SystemSetting {
    ossConfig: OssConfig;
  }

  export function getSystemSetting() {
    return HttpClient.get<SystemSetting>('cms/system-setting');
  }

  export function updateSystemSetting(params: SystemSetting) {
    return HttpClient.post('cms/system-setting/update', params);
  }
}
