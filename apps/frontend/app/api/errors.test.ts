import { describe, it, expect } from 'vitest';
import { ApiErrorTag, ApiError, mapResultCodeToTag } from './errors';

describe('ApiErrorTag', () => {
  it('should be a union of ResultCode error tags', () => {
    const tag: ApiErrorTag = 'LoginError';
    expect(tag).toBe('LoginError');
  });
});

describe('ApiError', () => {
  it('should have _tag and message properties', () => {
    const error: ApiError = { _tag: 'LoginError', message: 'test' };
    expect(error._tag).toBe('LoginError');
    expect(error.message).toBe('test');
  });
});

describe('mapResultCodeToTag', () => {
  it('should return null for success code 0000', () => {
    expect(mapResultCodeToTag('0000')).toBeNull();
  });

  it('should map ERR0001 to RegisterError', () => {
    expect(mapResultCodeToTag('ERR0001')).toBe('RegisterError');
  });

  it('should map ERR0002 to LoginError', () => {
    expect(mapResultCodeToTag('ERR0002')).toBe('LoginError');
  });

  it('should map ERR0003 to DatabaseError', () => {
    expect(mapResultCodeToTag('ERR0003')).toBe('DatabaseError');
  });

  it('should map ERR0004 to UploadError', () => {
    expect(mapResultCodeToTag('ERR0004')).toBe('UploadError');
  });

  it('should map ERR0005 to ValidationError', () => {
    expect(mapResultCodeToTag('ERR0005')).toBe('ValidationError');
  });

  it('should map ERR0006 to UnknownError', () => {
    expect(mapResultCodeToTag('ERR0006')).toBe('UnknownError');
  });

  it('should return null for unknown codes', () => {
    expect(mapResultCodeToTag('UNKNOWN')).toBeNull();
  });
});
