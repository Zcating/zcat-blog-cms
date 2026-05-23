import { describe, expect, it } from 'vitest';

import { csrfContext } from './csrf-context';

describe('csrfContext', () => {
  it('get returns null outside of run', () => {
    expect(csrfContext.get()).toBeNull();
  });

  it('run stores token accessible via get', () => {
    csrfContext.run('my-token', () => {
      expect(csrfContext.get()).toBe('my-token');
    });
  });

  it('run with null clears token', () => {
    csrfContext.run('prev', () => {});
    csrfContext.run(null, () => {
      expect(csrfContext.get()).toBeNull();
    });
  });

  it('set stores token', () => {
    csrfContext.set('new-token');
    // In test env, enterWith persists
    expect(csrfContext.get()).toBe('new-token');
  });
});
