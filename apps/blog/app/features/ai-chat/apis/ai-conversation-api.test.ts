import { describe, expect, it } from 'vitest';

import { AiConversationApi } from './ai-conversation-api';

describe('AiConversationApi', () => {
  it('createConversationId returns a string with timestamp prefix', () => {
    const id = AiConversationApi.createConversationId();
    expect(id).toContain('-');
    expect(id.length).toBeGreaterThan(20);
  });
});
