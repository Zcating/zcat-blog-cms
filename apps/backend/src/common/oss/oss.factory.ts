import { createMinioStrategy } from './minio.strategy';
import { createQiniuStrategy } from './qiniu.strategy';

import type { OssStrategy } from './oss.strategy';

export type OssProvider = 'qiniu' | 'minio';

let cachedStrategy: OssStrategy | null = null;

export function createOssStrategy(): OssStrategy {
  if (cachedStrategy) {
    return cachedStrategy;
  }

  const provider = (process.env.OSS_PROVIDER ?? 'qiniu') as OssProvider;

  switch (provider) {
    case 'minio':
      cachedStrategy = createMinioStrategy();
      break;
    case 'qiniu':
    default:
      cachedStrategy = createQiniuStrategy();
      break;
  }

  return cachedStrategy;
}

export function resetOssStrategy(): void {
  cachedStrategy = null;
}
