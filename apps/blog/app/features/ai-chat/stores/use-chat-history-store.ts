import { create } from 'zustand';

import {
  AiConversationApi,
  type ChatHistorySummary,
  type CreateChatHistoryParams,
  type UpdateChatHistoryParams,
} from '../apis/ai-conversation-api';

interface ChatHistoryState {
  histories: ChatHistorySummary[];
  fetchHistories: () => Promise<void>;
  addHistory: (history: CreateChatHistoryParams) => Promise<string>;
  updateHistory: (params: UpdateChatHistoryParams) => Promise<void>;
  deleteHistory: (id: string) => Promise<void>;
}

export const useChatHistoryStore = create<ChatHistoryState>((set) => ({
  histories: [],
  fetchHistories: async () => {
    const data = await AiConversationApi.getChatHistorySummaries();
    set({ histories: data });
  },

  addHistory: async (params) => {
    const created = await AiConversationApi.createChatHistory(params);
    set((state) => ({
      histories: [created, ...state.histories],
    }));
    return created.id;
  },

  updateHistory: async (params: UpdateChatHistoryParams) => {
    await AiConversationApi.updateChatHistory(params);
    set((state) => ({
      histories: state.histories.map((h) =>
        h.id === params.id ? { ...h, ...params } : h,
      ),
    }));
  },

  deleteHistory: async (id: string) => {
    await AiConversationApi.deleteChatHistory(id);
    set((state) => ({
      histories: state.histories.filter((h) => h.id !== id),
    }));
  },
}));
