import React from 'react';

import { LRUCache } from './lru-cache';

const HISTORY_SIZE = 100;

export interface SentHistory {
  history: string[];
  currentIndex: number;
  addMessage: (message: string) => void;
  goBack: () => string | null;
  goForward: () => string | null;
  reset: () => void;
}

export function useSentHistory(): SentHistory {
  const cache = React.useMemo(
    () => new LRUCache<string, string>(HISTORY_SIZE),
    [],
  );
  const [history, setHistory] = React.useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = React.useState(-1);

  React.useEffect(() => {
    setHistory(cache.toArray());
  }, [cache]);

  const addMessage = React.useCallback(
    (message: string) => {
      if (!message.trim()) return;
      cache.set(Date.now().toString(), message);
      setHistory(cache.toArray());
      setCurrentIndex(-1);
    },
    [cache],
  );

  const goBack = React.useCallback(() => {
    if (history.length === 0) return null;
    const newIndex =
      currentIndex < history.length - 1 ? currentIndex + 1 : currentIndex;
    setCurrentIndex(newIndex);
    return history[history.length - 1 - newIndex] || null;
  }, [history, currentIndex]);

  const goForward = React.useCallback(() => {
    if (currentIndex <= 0) {
      setCurrentIndex(-1);
      return '';
    }
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    return history[history.length - 1 - newIndex] || '';
  }, [history, currentIndex]);

  const reset = React.useCallback(() => {
    setCurrentIndex(-1);
  }, []);

  return {
    history,
    currentIndex,
    addMessage,
    goBack,
    goForward,
    reset,
  };
}
