import { describe, expect, it } from 'vitest';

import { OssAction } from './oss.action';

describe('OssAction', () => {
  it('has expected namespace methods', () => {
    expect(typeof OssAction.createPhoto).toBe('function');
    expect(typeof OssAction.createAlbumPhoto).toBe('function');
    expect(typeof OssAction.updatePhoto).toBe('function');
    expect(typeof OssAction.deletePhoto).toBe('function');
    expect(typeof OssAction.updateUserInfo).toBe('function');
    expect(typeof OssAction.createArticle).toBe('function');
    expect(typeof OssAction.updateArticle).toBe('function');
  });
});
