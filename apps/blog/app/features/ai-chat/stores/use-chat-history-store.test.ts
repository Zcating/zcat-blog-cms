import { describe, expect, it, vi } from 'vitest';

import { useChatHistoryStore } from './use-chat-history-store';
import { AiConversationApi } from '../apis/ai-conversation-api';

vi.mock('../apis/ai-conversation-api', () => ({
  AiConversationApi: {
    getChatHistorySummaries: vi.fn(),
    createChatHistory: vi.fn(),
    updateChatHistory: vi.fn(),
    deleteChatHistory: vi.fn(),
  },
}));

describe('useChatHistoryStore', () => {
  beforeEach(() => {
    useChatHistoryStore.setState({ histories: [] });
    vi.clearAllMocks();
  });

  it('fetchHistories updates histories from API', async () => {
    const mockData = [
      { id: '1', title: 'Chat 1', createdAt: 100, updatedAt: 200 },
    ];
    vi.mocked(AiConversationApi.getChatHistorySummaries).mockResolvedValueOnce(
      mockData as any,
    );

    await useChatHistoryStore.getState().fetchHistories();
    expect(useChatHistoryStore.getState().histories).toEqual(mockData);
  });

  it('addHistory prepends new history', async () => {
    vi.mocked(AiConversationApi.createChatHistory).mockResolvedValueOnce({
      id: 'new-id',
      title: 'New',
      model: 'deepseek',
      deepThinking: false,
    } as any);

    const id = await useChatHistoryStore.getState().addHistory({
      title: 'New',
      model: 'deepseek',
      deepThinking: false,
      messages: [],
    });

    expect(id).toBe('new-id');
    expect(useChatHistoryStore.getState().histories).toHaveLength(1);
    expect(useChatHistoryStore.getState().histories[0].id).toBe('new-id');
  });

  it('updateHistory updates matching history', async () => {
    useChatHistoryStore.setState({
      histories: [
        { id: '1', title: 'Old', model: 'deepseek', deepThinking: false },
      ] as any,
    });

    vi.mocked(AiConversationApi.updateChatHistory).mockResolvedValueOnce(
      undefined,
    );

    await useChatHistoryStore
      .getState()
      .updateHistory({ id: '1', title: 'Updated' } as any);

    const histories = useChatHistoryStore.getState().histories;
    expect(histories[0].title).toBe('Updated');
  });

  it('deleteHistory removes the history', async () => {
    useChatHistoryStore.setState({
      histories: [
        { id: '1', title: 'A' },
        { id: '2', title: 'B' },
      ] as any,
    });

    vi.mocked(AiConversationApi.deleteChatHistory).mockResolvedValueOnce(
      undefined,
    );

    await useChatHistoryStore.getState().deleteHistory('1');
    expect(useChatHistoryStore.getState().histories).toHaveLength(1);
    expect(useChatHistoryStore.getState().histories[0].id).toBe('2');
  });
});
