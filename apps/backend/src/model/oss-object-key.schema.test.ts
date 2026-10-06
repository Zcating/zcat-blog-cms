import { OssObjectKeySchema } from './oss-object-key.schema';

const accepts = (key: string) => OssObjectKeySchema.safeParse(key).success;

describe('OssObjectKeySchema', () => {
  describe('keys the system produces', () => {
    it.each([
      'photos/1767225849260-1685914.jpg',
      'photos/1767225849260-1685914.thumbnail.jpg',
      'user/1767225849260-1685914.png',
      'articles/1767225849260-1685914.webp',
      'verify-oss-probe/9f86d081884c7d659a2feaa0c55ad015.txt',
      'photos/sunset.jpg',
      'photos/cover.thumbnail.jpg',
      'photos/thumb_1.jpg',
      'avatar.jpg',
      'uploads/photos/thumbnails/a.jpg',
      '',
    ])('accepts %j', (key) => {
      expect(accepts(key)).toBe(true);
    });
  });

  describe('addresses that are not object keys', () => {
    it.each([
      'https://signed.oss.invalid/user/avatar.jpg?X-Amz-Signature=deadbeef',
      'http://127.0.0.1:9090/photos/a.jpg',
      'HTTPS://SIGNED.OSS.INVALID/a.jpg',
      '//signed.oss.invalid/photos/a.jpg',
      'data:image/png;base64,iVBORw0KGgo=',
      'blob:https://app.local/2f9a-4c1b',
      'file:///etc/passwd',
      'photos/a.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256',
      'photos/a.jpg#anchor',
      'photos/../../etc/passwd',
      'photos/..',
      '..',
      'photos//a.jpg/../b.jpg',
      '/photos/a.jpg',
      'photos\\a.jpg',
      'photos/a b.jpg',
      'photos/a\tb.jpg',
      'photos/a\nb.jpg',
      'photos/a\u0000b.jpg',
      'photos/a\u007fb.jpg',
    ])('rejects %j', (key) => {
      expect(accepts(key)).toBe(false);
    });
  });

  it('explains the rejection instead of failing silently', () => {
    const result = OssObjectKeySchema.safeParse(
      'https://signed.oss.invalid/a.jpg?X-Amz-Signature=deadbeef',
    );

    expect(result.success).toBe(false);
    if (result.success) {
      return;
    }
    expect(result.error.issues[0].message).toBe(
      '文件地址必须是 OSS 对象 key，不能是完整 URL',
    );
  });
});
