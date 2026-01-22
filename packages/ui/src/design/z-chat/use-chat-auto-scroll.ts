import * as React from 'react';

import { useMemoizedFn, useMount } from '@zcat/ui/hooks';
import { throttle } from '@zcat/ui/utils';

export interface UseChatAutoScrollOptions {
  bottomTolerance?: number;
  intervalMs?: number;
}

export function useChatAutoScroll(options: UseChatAutoScrollOptions = {}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { bottomTolerance = 10, intervalMs = 300 } = options;

  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const isAtBottomRef = React.useRef(true);

  const scrollToBottom = useMemoizedFn(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    el.scrollTo({
      top: el.scrollHeight,
      behavior: 'smooth',
    });
  });

  const updateIsAtBottom = useMemoizedFn(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    const { scrollHeight, scrollTop, clientHeight } = el;
    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
    const nextIsAtBottom = distanceToBottom <= bottomTolerance;
    if (nextIsAtBottom !== isAtBottomRef.current) {
      isAtBottomRef.current = nextIsAtBottom;
      setIsAtBottom(nextIsAtBottom);
    }
  });

  useMount(() => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }

    const startScroll = throttle(() => {
      if (!isAtBottomRef.current) {
        return;
      }
      scrollToBottom();
    }, intervalMs);
    const observer = new MutationObserver(() => {
      startScroll();
      console.log('isAtBottomRef.current', isAtBottomRef.current);
    });

    observer.observe(el, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    updateIsAtBottom();

    return () => {
      observer.disconnect();
    };
  });

  const lockToBottom = useMemoizedFn(() => {
    isAtBottomRef.current = true;
    setIsAtBottom(true);
    scrollToBottom();
  });

  return {
    scrollRef,
    isAtBottom,
    lockToBottom,
    updateIsAtBottom,
  };
}
