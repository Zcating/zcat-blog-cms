import { MessageSquare } from 'lucide-react';
import React from 'react';

import { useMount } from '@zcat/ui/hooks';
import { isFunction } from '@zcat/ui/utils';

import { cn } from '../../shadcn/lib/utils';
import { ZView } from '../z-view/z-view';

import { MessageInput } from './message-input';
import { MessageItem } from './message-item';
import { observeMessage } from './observable-message';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  isFinish?: boolean;
}

export interface ZChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[];
  onSend: (message: Message) => void | Promise<void>;
  onAbort?: () => void;
  placeholder?: string;
  emptyComponent?: React.ReactNode;
}

export function createObservableMessage(message: Message): Message {
  return observeMessage(message);
}

export function ZChat({
  messages,
  onSend,
  onAbort,
  placeholder = 'Type a message...',
  className,
  emptyComponent: emptyState,
  ...props
}: ZChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const renderedMessages = React.useMemo(() => {
    return messages.map(observeMessage);
  }, [messages]);

  const scrollToBottom = () => {
    if (!scrollRef.current) {
      return;
    }
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  useMount(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) {
      return;
    }
    const observer = new MutationObserver(() => {
      scrollToBottom();
      // const { scrollHeight, scrollTop, clientHeight } = scrollElement;
      // // 如果距离底部小于 200px，则自动滚动到底部
      // // 这样允许用户向上滚动查看历史消息而不被强制拉回
      // if (scrollHeight - scrollTop - clientHeight < 400) {
      //   scrollToBottom();
      // }
    });

    observer.observe(scrollElement, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => {
      observer.disconnect();
    };
  });

  const renderEmptyState = () => {
    if (emptyState) {
      return emptyState;
    }
    return (
      <ZView className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
        <p className="opacity-50 text-sm">暂无消息，开始一个新的对话吧</p>
      </ZView>
    );
  };

  const [loading, setLoading] = React.useState(false);
  const handleSend = async (content: string) => {
    setLoading(true);
    try {
      const result = onSend({ role: 'user', content });
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = () => {
    if (isFunction(onAbort)) {
      onAbort();
    }
    setLoading(false);
  };

  return (
    <ZView
      className={cn(
        'flex flex-col h-full w-full bg-background overflow-hidden p-3',
        className,
      )}
      {...props}
    >
      <ZView ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {renderedMessages.length === 0
          ? renderEmptyState()
          : renderedMessages.map((message, index) => (
              <MessageItem key={message.id ?? index} message={message} />
            ))}
      </ZView>
      <MessageInput
        onSend={handleSend}
        onAbort={handleAbort}
        loading={loading}
        placeholder={placeholder}
      />
    </ZView>
  );
}
