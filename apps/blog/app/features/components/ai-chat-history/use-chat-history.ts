import { useAtomValue, useSetAtom } from 'jotai/react';
import { useEffect, useCallback } from 'react';

import {
  chatHistoriesAtom,
  chatHistoriesHasMoreAtom,
  chatHistoriesLoadingAtom,
  createChatHistoryAtom,
  getChatHistoryAtom,
  deleteChatHistoryAtom,
  loadChatHistoriesAtom,
  loadMoreChatHistoriesAtom,
  refreshChatHistoriesAtom,
  updateChatHistoryAtom,
} from './chat-history-atoms';

import type {
  ChatHistory,
  ChatHistorySummary,
  CreateChatHistoryParams,
} from './chat-history-types';

interface UseChatHistoryReturn {
  histories: ChatHistorySummary[];
  loading: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  createHistory: (params: CreateChatHistoryParams) => Promise<ChatHistory>;
  getHistory: (id: string) => Promise<ChatHistory | undefined>;
  updateHistory: (
    id: string,
    updates: Partial<ChatHistory>,
  ) => Promise<ChatHistory | undefined>;
  deleteHistory: (id: string) => Promise<boolean>;
  hasMore: boolean;
}

export function useChatHistory(): UseChatHistoryReturn {
  const histories = useAtomValue(chatHistoriesAtom);
  const loading = useAtomValue(chatHistoriesLoadingAtom);
  const hasMore = useAtomValue(chatHistoriesHasMoreAtom);

  const loadHistories = useSetAtom(loadChatHistoriesAtom);
  const loadMore = useSetAtom(loadMoreChatHistoriesAtom);
  const refresh = useSetAtom(refreshChatHistoriesAtom);
  const createHistory = useSetAtom(createChatHistoryAtom);
  const getHistory = useSetAtom(getChatHistoryAtom);
  const updateHistory = useSetAtom(updateChatHistoryAtom);
  const deleteHistory = useSetAtom(deleteChatHistoryAtom);

  useEffect(() => {
    loadHistories(true);
  }, [loadHistories]);

  return {
    histories,
    loading,
    loadMore,
    refresh,
    createHistory,
    getHistory,
    updateHistory,
    deleteHistory,
    hasMore,
  };
}
