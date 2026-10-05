import { describe, expect, it } from 'vitest';

import { toSameOriginOssImage } from './oss-image-url';

describe('toSameOriginOssImage', () => {
  it('rewrites an object storage url onto the same-origin proxy, path only', () => {
    const result = toSameOriginOssImage(
      'http://localhost:19000/pictures/user/avatar.png',
    );

    expect(result).toBe(
      `/api/oss/image?path=${encodeURIComponent('/pictures/user/avatar.png')}`,
    );
  });

  it('keeps a query string on the source url inside path', () => {
    const result = toSameOriginOssImage('https://cdn.example/a.png?v=2');

    expect(result).toBe(
      `/api/oss/image?path=${encodeURIComponent('/a.png?v=2')}`,
    );
  });

  it('leaves an empty url alone', () => {
    expect(toSameOriginOssImage('')).toBe('');
  });

  it('leaves a relative url alone', () => {
    expect(toSameOriginOssImage('/local/a.png')).toBe('/local/a.png');
  });

  it('leaves a data url alone', () => {
    const data = 'data:image/png;base64,iVBORw0KGgo=';
    expect(toSameOriginOssImage(data)).toBe(data);
  });
});
