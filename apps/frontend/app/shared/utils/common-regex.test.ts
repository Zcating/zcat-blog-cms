import { describe, expect, it } from 'vitest';

import { CommonRegex } from './common-regex';

describe('CommonRegex', () => {
  describe('MARKDOWN_IMAGE_REGEX', () => {
    it('matches markdown image syntax', () => {
      const text = '![alt text](/path/to/image.jpg)';
      const matches = [...text.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX)];
      expect(matches).toHaveLength(1);
      expect(matches[0][1]).toBe('alt text');
      expect(matches[0][2]).toBe('/path/to/image.jpg');
    });

    it('matches multiple images', () => {
      const text = '![img1](url1) text ![img2](url2)';
      const matches = [...text.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX)];
      expect(matches).toHaveLength(2);
    });

    it('returns empty when no images', () => {
      const text = 'plain text without images';
      const matches = [...text.matchAll(CommonRegex.MARKDOWN_IMAGE_REGEX)];
      expect(matches).toHaveLength(0);
    });
  });
});
