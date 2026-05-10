import { describe, it, expect } from 'vitest';

import { runWithRequest, getCurrentRequest } from './request-context';

describe('request-context', () => {
  describe('runWithRequest', () => {
    it('should store request and make it available in callback', async () => {
      const req = new Request('http://localhost:3000/dashboard', {
        headers: { Cookie: 'token=Bearer%20test-token' },
      });

      const captured: Request[] = [];
      await runWithRequest(req, async () => {
        captured.push(getCurrentRequest()!);
      });

      expect(captured).toHaveLength(1);
      expect(captured[0].url).toBe('http://localhost:3000/dashboard');
      expect(captured[0].headers.get('Cookie')).toBe(
        'token=Bearer%20test-token',
      );
    });
  });

  describe('getCurrentRequest', () => {
    it('should return undefined when called outside runWithRequest', () => {
      expect(getCurrentRequest()).toBeUndefined();
    });
  });

  describe('isolation', () => {
    it('should isolate requests between concurrent calls', async () => {
      const reqA = new Request('http://localhost:3000/a');
      const reqB = new Request('http://localhost:3000/b');

      const results: string[] = [];
      await Promise.all([
        runWithRequest(reqA, async () => {
          await new Promise((r) => setTimeout(r, 10));
          results.push(getCurrentRequest()!.url);
        }),
        runWithRequest(reqB, async () => {
          results.push(getCurrentRequest()!.url);
        }),
      ]);

      expect(results).toContain('http://localhost:3000/a');
      expect(results).toContain('http://localhost:3000/b');
    });
  });
});
