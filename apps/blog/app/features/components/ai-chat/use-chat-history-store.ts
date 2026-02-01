import { create } from 'zustand';

import {
  createChatHistory,
  deleteChatHistory,
  getChatHistory,
  getChatHistorySummaries,
  updateChatHistory,
} from './chat-history-storage';

import type {
  ChatHistory,
  ChatHistorySummary,
  CreateChatHistoryParams,
} from './chat-history-types';

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
    if (loading) return;

    const actualOffset = resetData ? 0 : offset;
    if (!resetData && !hasMore) return;

    set({ loading: true });

    try {
      const newHistories = await getChatHistorySummaries(
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
    const chat = await createChatHistory(params);
    await get().refreshChatHistories();
    return chat;
  },

  getChatHistory: async (id: string) => {
    return getChatHistory(id);
  },

  updateChatHistory: async (id: string, updates: Partial<ChatHistory>) => {
    const updated = await updateChatHistory(id, updates);
    if (updated) {
      await get().refreshChatHistories();
    }
    return updated;
  },

  deleteChatHistory: async (id: string) => {
    const deleted = await deleteChatHistory(id);
    if (deleted) {
      await get().refreshChatHistories();
    }
    return deleted;
  },
}));
