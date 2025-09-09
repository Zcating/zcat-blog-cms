import { SystemSettingApi } from '@cms/api';

import * as qiniu from 'qiniu-js';

export namespace OssAction {
  const state = {
    accessKey: '',
    secretKey: '',
  };
  export async function init() {
    const res = await SystemSettingApi.getSystemSetting();
    state.accessKey = res.ossConfig.accessKey;
    state.secretKey = res.ossConfig.secretKey;
  }

  export async function upload() {
    qiniu;
  }
}
