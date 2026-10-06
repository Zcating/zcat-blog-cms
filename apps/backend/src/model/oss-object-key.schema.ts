import { z } from 'zod';

const SCHEME_PREFIX = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;
const PARENT_SEGMENT = /(^|\/)\.\.(\/|$)/;

const OBJECT_KEY_MESSAGE = '文件地址必须是 OSS 对象 key，不能是完整 URL';

function isWhitespaceOrControl(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return code <= 0x20 || code === 0x7f || /\s/.test(char);
}

function isBareObjectKey(value: string): boolean {
  if (SCHEME_PREFIX.test(value)) {
    return false;
  }

  if (value.startsWith('/') || value.includes('\\')) {
    return false;
  }

  if (value.includes('?') || value.includes('#')) {
    return false;
  }

  if (PARENT_SEGMENT.test(value)) {
    return false;
  }

  return ![...value].some(isWhitespaceOrControl);
}

export const OssObjectKeySchema = z
  .string()
  .refine(isBareObjectKey, { message: OBJECT_KEY_MESSAGE });

export type OssObjectKeyDto = z.infer<typeof OssObjectKeySchema>;
