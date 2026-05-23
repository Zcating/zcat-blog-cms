import { describe, expect, it } from 'vitest';

import { AES_MODES, AES_PADDINGS, AES_ENCODINGS, OPERATION_MODES } from './aes-crypto';

describe('AES Crypto constants', () => {
  it('AES_MODES has all modes', () => {
    const values = AES_MODES.map((m) => m.value);
    expect(values).toContain('CBC');
    expect(values).toContain('ECB');
    expect(values).toContain('CFB');
    expect(values).toContain('OFB');
    expect(values).toContain('CTR');
  });

  it('AES_PADDINGS has all padding options', () => {
    const values = AES_PADDINGS.map((m) => m.value);
    expect(values).toContain('Pkcs7');
    expect(values).toContain('Iso97971');
    expect(values).toContain('AnsiX923');
    expect(values).toContain('Iso10126');
    expect(values).toContain('ZeroPadding');
    expect(values).toContain('NoPadding');
  });

  it('AES_ENCODINGS has all encoding options', () => {
    const values = AES_ENCODINGS.map((m) => m.value);
    expect(values).toContain('Utf8');
    expect(values).toContain('Hex');
    expect(values).toContain('Base64');
    expect(values).toContain('Latin1');
  });

  it('OPERATION_MODES has encrypt and decrypt', () => {
    const values = OPERATION_MODES.map((m) => m.value);
    expect(values).toContain('encrypt');
    expect(values).toContain('decrypt');
  });
});
