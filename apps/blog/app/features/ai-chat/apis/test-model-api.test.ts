import { describe, expect, it, vi } from 'vitest';

import { TestModelApi } from './test-model-api';
import { Stream } from '../utils/stream/stream';

vi.mock('../utils/stream/stream', () => ({
  Stream: {
    from: vi.fn(),
  },
}));

describe('TestModelApi', () => {
  it('chat calls Stream.from with a ReadableStream', () => {
    vi.mocked(Stream.from).mockReturnValue({} as any);

    const controller = new AbortController();
    const result = TestModelApi.chat('api-key', [
      { role: 'user', content: 'hello' },
    ] as any, false, controller);

    expect(Stream.from).toHaveBeenCalledOnce();
    const streamArg = vi.mocked(Stream.from).mock.calls[0][0];
    expect(streamArg).toBeInstanceOf(ReadableStream);
    expect(vi.mocked(Stream.from).mock.calls[0][1]).toBe(controller);
  });
});
