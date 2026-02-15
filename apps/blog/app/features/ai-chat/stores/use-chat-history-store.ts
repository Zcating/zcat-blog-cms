import { create } from 'zustand';

import { AiChatHistoryApi } from '../apis';

import type {
  ChatHistory,
  ChatHistorySummary,
  CreateChatHistoryParams,
} from '../chat-history-types';

const PAGE_SIZE = 20;

interface ChatHistoryState {
  histories: ChatHistorySummary[];
  loading: boolean;
  hasMore: boolean;
  offset: number;
}

interface ChatHistoryActions {
  loadChatHistories: (resetData?: boolean) => Promise<void>;
  loadMoreChatHistories: () => Promise<void>;
  refreshChatHistories: () => Promise<void>;
  createChatHistory: (params: CreateChatHistoryParams) => Promise<ChatHistory>;
  getChatHistory: (id: string) => Promise<ChatHistory | undefined>;
  updateChatHistory: (
    id: string,
    updates: Partial<ChatHistory>,
  ) => Promise<ChatHistory | undefined>;
  deleteChatHistory: (id: string) => Promise<boolean>;
}

export const useChatHistoryStore = create<
  ChatHistoryState & ChatHistoryActions
>((set, get) => ({
  histories: [],
  loading: false,
  hasMore: true,
  offset: 0,

  loadChatHistories: async (resetData: boolean = false) => {
    const { loading, offset, hasMore } = get();
    if (loading) {
      return;
    }

    const actualOffset = resetData ? 0 : offset;
    if (!resetData && !hasMore) {
      return;
    }
    set({ loading: true });

    try {
      const newHistories = await AiChatHistoryApi.getChatHistorySummaries(
        PAGE_SIZE,
        actualOffset,
      );

      if (resetData) {
        set({
          histories: newHistories,
          offset: PAGE_SIZE,
          hasMore: newHistories.length === PAGE_SIZE,
        });
      } else {
        set({
          histories: [...get().histories, ...newHistories],
          offset: actualOffset + PAGE_SIZE,
          hasMore: newHistories.length === PAGE_SIZE,
        });
      }
    } finally {
      set({ loading: false });
    }
  },

  loadMoreChatHistories: async () => {
    const { hasMore, loading } = get();
    if (hasMore && !loading) {
      await get().loadChatHistories(false);
    }
  },

  refreshChatHistories: async () => {
    await get().loadChatHistories(true);
  },

  createChatHistory: async (params: CreateChatHistoryParams) => {
    const chat = await AiChatHistoryApi.createChatHistory(params);
    await get().refreshChatHistories();
    return chat;
  },

  getChatHistory: async (id: string) => {
    return AiChatHistoryApi.getChatHistory(id);
  },

  updateChatHistory: async (id: string, updates: Partial<ChatHistory>) => {
    const updated = await AiChatHistoryApi.updateChatHistory(id, updates);
    if (updated) {
      set((state) => ({
        histories: state.histories.map((h) =>
          h.id === id
            ? {
                ...h,
                title: updated.title,
                preview:
                  updated.messages
                    .find((m) => m.role === 'user')
                    ?.content.slice(0, 100) || '',
                deepThinking: updated.deepThinking,
                model: updated.model,
                updatedAt: updated.updatedAt,
              }
            : h,
        ),
      }));
    }
    return updated;
  },

  deleteChatHistory: async (id: string) => {
    const deleted = await AiChatHistoryApi.deleteChatHistory(id);
    if (deleted) {
      await get().refreshChatHistories();
    }
    return deleted;
  },
}));
