import { useCallback, useEffect, useState } from 'react';

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

const PAGE_SIZE = 20;

export function useChatHistory(): UseChatHistoryReturn {
  const [histories, setHistories] = useState<ChatHistorySummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const loadHistories = useCallback(
    async (reset: boolean = false) => {
      setLoading(true);
      try {
        const currentOffset = reset ? 0 : offset;
        const newHistories = await getChatHistorySummaries(
          PAGE_SIZE,
          currentOffset,
        );

        if (reset) {
          setHistories(newHistories);
          setOffset(PAGE_SIZE);
        } else {
          setHistories((prev) => [...prev, ...newHistories]);
          setOffset((prev) => prev + PAGE_SIZE);
        }

        setHasMore(newHistories.length === PAGE_SIZE);
      } finally {
        setLoading(false);
      }
    },
    [offset],
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await loadHistories(false);
  }, [loading, hasMore, loadHistories]);

  const refresh = useCallback(async () => {
    await loadHistories(true);
  }, [loadHistories]);

  useEffect(() => {
    loadHistories(true);
  }, []);

  const createHistory = useCallback(
    async (params: CreateChatHistoryParams): Promise<ChatHistory> => {
      const chat = await createChatHistory(params);
      await refresh();
      return chat;
    },
    [refresh],
  );

  const getHistory = useCallback(
    async (id: string): Promise<ChatHistory | undefined> => {
      return getChatHistory(id);
    },
    [],
  );

  const updateHistory = useCallback(
    async (
      id: string,
      updates: Partial<ChatHistory>,
    ): Promise<ChatHistory | undefined> => {
      const updated = await updateChatHistory(id, updates);
      if (updated) {
        await refresh();
      }
      return updated;
    },
    [refresh],
  );

  const deleteHistory = useCallback(
    async (id: string): Promise<boolean> => {
      const deleted = await deleteChatHistory(id);
      if (deleted) {
        await refresh();
      }
      return deleted;
    },
    [refresh],
  );

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
