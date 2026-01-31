import { atom } from 'jotai';

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

export const chatHistoriesAtom = atom<ChatHistorySummary[]>([]);

export const chatHistoriesLoadingAtom = atom(false);

export const chatHistoriesHasMoreAtom = atom(true);

export const chatHistoriesOffsetAtom = atom(0);

export const loadChatHistoriesAtom = atom(
  null,
  async (get, reset, resetData: boolean = false) => {
    const loading = get(chatHistoriesLoadingAtom);
    if (loading) return;

    const offset = resetData ? 0 : get(chatHistoriesOffsetAtom);
    const hasMore = get(chatHistoriesHasMoreAtom);

    if (!resetData && !hasMore) return;

    reset(chatHistoriesLoadingAtom, true);

    try {
      const newHistories = await getChatHistorySummaries(PAGE_SIZE, offset);

      if (resetData) {
        reset(chatHistoriesAtom, newHistories);
        reset(chatHistoriesOffsetAtom, PAGE_SIZE);
      } else {
        const currentHistories = get(chatHistoriesAtom);
        reset(chatHistoriesAtom, [...currentHistories, ...newHistories]);
        reset(chatHistoriesOffsetAtom, offset + PAGE_SIZE);
      }

      reset(chatHistoriesHasMoreAtom, newHistories.length === PAGE_SIZE);
    } finally {
      reset(chatHistoriesLoadingAtom, false);
    }
  },
);

export const loadMoreChatHistoriesAtom = atom(null, async (get, reset) => {
  const hasMore = get(chatHistoriesHasMoreAtom);
  const loading = get(chatHistoriesLoadingAtom);

  if (hasMore && !loading) {
    await reset(loadChatHistoriesAtom, false);
  }
});

export const refreshChatHistoriesAtom = atom(null, async (get, reset) => {
  await reset(loadChatHistoriesAtom, true);
});

export const createChatHistoryAtom = atom(
  null,
  async (get, reset, params: CreateChatHistoryParams): Promise<ChatHistory> => {
    const chat = await createChatHistory(params);
    await reset(refreshChatHistoriesAtom);
    return chat;
  },
);

export const getChatHistoryAtom = atom(
  null,
  async (get, reset, id: string): Promise<ChatHistory | undefined> => {
    return getChatHistory(id);
  },
);

export const updateChatHistoryAtom = atom(
  null,
  async (get, reset, id: string, updates: Partial<ChatHistory>) => {
    const updated = await updateChatHistory(id, updates);
    if (updated) {
      await reset(refreshChatHistoriesAtom);
    }
    return updated;
  },
);

export const deleteChatHistoryAtom = atom(
  null,
  async (get, reset, id: string): Promise<boolean> => {
    const deleted = await deleteChatHistory(id);
    if (deleted) {
      await reset(refreshChatHistoriesAtom);
    }
    return deleted;
  },
);
