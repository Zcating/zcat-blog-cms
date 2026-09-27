import * as crypto from 'crypto';

// This list *is* the checksum contract: exactly these fields, in this order, and
// nothing else. Adding a field here changes what the client must hash, so it is a
// breaking change to the wire format, not a local refactor. It is a plain md5
// digest with no secret, so it detects transport corruption and field drift only —
// it is not authentication and proves nothing about who sent the request.
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
