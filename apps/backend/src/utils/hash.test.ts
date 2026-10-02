import { describe, it, expect } from 'vitest';

import { verifyPayloadChecksum } from './hash';

const MD5_OF_CHECKSUMMED_FIELDS_IN_FIELD_NAME_ORDER =
  'f2db8c88cc7b5676ba28117960984b3e';
const MD5_OF_SAME_FIELDS_IN_PAYLOAD_ORDER = '83e4a92746a5c3c9655bfbfc780e7967';
const MD5_OF_SAME_FIELDS_WITH_OTHER_PAGE_PATH =
  '9f3dbcf5b374ae3ce14b029aa4d434d4';

const CHECKSUMMED_FIELDS_IN_PAYLOAD_ORDER = {
  referrer: '',
  pageTitle: 'Checksum Contract',
  pagePath: '/posts/checksum-contract',
  os: 'macOS',
  deviceId: 'fp-contract',
  device: 'Desktop',
  browser: 'Chrome 120.0.0.0',
};

describe('verifyPayloadChecksum', () => {
  it('verifies the md5 of the seven checksummed fields and rejects the md5 of a different payload', () => {
    expect(
      verifyPayloadChecksum(
        CHECKSUMMED_FIELDS_IN_PAYLOAD_ORDER,
        MD5_OF_CHECKSUMMED_FIELDS_IN_FIELD_NAME_ORDER,
      ),
    ).toBe(true);
    expect(
      verifyPayloadChecksum(
        CHECKSUMMED_FIELDS_IN_PAYLOAD_ORDER,
        MD5_OF_SAME_FIELDS_WITH_OTHER_PAGE_PATH,
      ),
    ).toBe(false);
  });

  it('verifies a payload carrying keys outside the checksummed field set', () => {
    expect(
      verifyPayloadChecksum(
        { ...CHECKSUMMED_FIELDS_IN_PAYLOAD_ORDER, name: 'test', value: '123' },
        MD5_OF_CHECKSUMMED_FIELDS_IN_FIELD_NAME_ORDER,
      ),
    ).toBe(true);
  });

  it('joins the fields in field-name order rather than payload order', () => {
    expect(
      verifyPayloadChecksum(
        CHECKSUMMED_FIELDS_IN_PAYLOAD_ORDER,
        MD5_OF_SAME_FIELDS_IN_PAYLOAD_ORDER,
      ),
    ).toBe(false);
  });

  it('returns false when hash does not match', () => {
    const result = verifyPayloadChecksum({ key: 'value' }, 'invalid-hash');

    expect(result).toBe(false);
  });

  it('handles empty params object', () => {
    const result = verifyPayloadChecksum({}, '');

    expect(result).toBe(false);
  });
});
