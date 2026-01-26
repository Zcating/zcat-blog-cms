import * as React from 'react';

import { useMemoizedFn, useMount } from '@zcat/ui/hooks';

export interface UseChatAutoScrollOptions {
  bottomTolerance?: number;
  intervalMs?: number;
}

export function useChatAutoScroll(options: UseChatAutoScrollOptions = {}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { bottomTolerance = 10, intervalMs = 300 } = options;

  const [isAtBottom, setIsAtBottom] = React.useState(true);
  const isAtBottomRef = React.useRef(true);

  const scrollToBottom = useMemoizedFn((behavior: ScrollBehavior = 'auto') => {
    const el = scrollRef.current;
    if (!el) {
      return;
    }
    if (el.scrollHeight <= el.clientHeight + bottomTolerance) {
      return;
    }
    el.scrollTo({
      top: el.scrollHeight,
      behavior,
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

    // const startScroll = throttle(() => {
    //   if (!isAtBottomRef.current) {
    //     return;
    //   }
    //   scrollToBottom('auto');
    // }, intervalMs);
    const observer = new MutationObserver(() => {
      if (!isAtBottomRef.current) {
        return;
      }
      scrollToBottom('auto');
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
    scrollToBottom('smooth');
  });

  return {
    scrollRef,
    isAtBottom,
    lockToBottom,
    updateIsAtBottom,
  };
}
