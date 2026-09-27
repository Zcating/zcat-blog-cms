import * as crypto from 'crypto';

const CHECKSUMMED_PAYLOAD_FIELDS = [
  'browser',
  'device',
  'deviceId',
  'os',
  'pagePath',
  'pageTitle',
  'referrer',
] as const;

export function verifyPayloadChecksum(
  params: Record<string, any>,
  checksum: string,
): boolean {
  const serializedParams = [...CHECKSUMMED_PAYLOAD_FIELDS]
    .sort((a, b) => (a > b ? 1 : -1))
    .map((field) => `${field}=${params[field] ?? ''}`)
    .join('&');

  const computedChecksum = crypto
    .createHash('md5')
    .update(serializedParams)
    .digest('hex');

  return computedChecksum === checksum;
}
