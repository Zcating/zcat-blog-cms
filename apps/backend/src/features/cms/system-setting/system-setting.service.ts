import { Effect } from 'effect';

import { OssService, tryPromise } from '../../../common/effect';

export function getUploadConfig(key: string) {
  return Effect.gen(function* () {
    const oss = yield* OssService;
    const presignedUrl = yield* tryPromise(() =>
      oss.presignUploadUrl(key),
    );
    return { presignedUrl };
  });
}

export const systemSettingService = { getUploadConfig };
