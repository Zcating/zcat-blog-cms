import * as crypto from 'crypto';

export function hashTest(params: Record<string, any>, hash: string): boolean {
  const serializedParams = Object.keys(params)
    .sort((a, b) => (a > b ? 1 : -1))
    .map((item) => `${item}=${params[item]}`)
    .join('&');

  const computedHash = crypto
    .createHash('md5')
    .update(serializedParams)
    .digest('hex');

  return computedHash === hash;
}
