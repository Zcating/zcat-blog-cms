import { createMinioStrategy } from './minio.strategy';
import { createQiniuStrategy } from './qiniu.strategy';

import type { OssStrategy } from './oss.strategy';

export type OssProvider = 'minio' | 'qiniu';

let cachedStrategy: OssStrategy | null = null;

export function createOssStrategy(): OssStrategy {
  if (cachedStrategy) {
    return cachedStrategy;
  }

  const provider = (process.env.OSS_PROVIDER ?? 'minio') as OssProvider;

  switch (provider) {
    case 'qiniu':
      cachedStrategy = createQiniuStrategy();
      break;
    case 'minio':
    default:
      cachedStrategy = createMinioStrategy();
      break;
  }

  return cachedStrategy;
}

export function resetOssStrategy(): void {
  cachedStrategy = null;
}
