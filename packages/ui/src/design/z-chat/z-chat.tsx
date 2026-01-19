import { Loader2, MessageSquare } from 'lucide-react';
import * as React from 'react';

import { useMount } from '@zcat/ui/hooks';

import { cn } from '../../shadcn/lib/utils';
import { ZView } from '../z-view/z-view';

import { MessageInput } from './message-input';
import { MessageItem } from './message-item';
import { ZChatManager } from './z-chat-manager';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  time?: string;
}

export interface ZChatProps extends React.HTMLAttributes<HTMLDivElement> {
  manager: ZChatManager;
  onSend: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
  emptyComponent?: React.ReactNode;
}

export function ZChat({
  manager,
  onSend,
  loading = false,
  placeholder = 'Type a message...',
  className,
  emptyComponent: emptyState,
  ...props
}: ZChatProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

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
      const { scrollHeight, scrollTop, clientHeight } = scrollElement;
      // 如果距离底部小于 200px，则自动滚动到底部
      // 这样允许用户向上滚动查看历史消息而不被强制拉回
      if (scrollHeight - scrollTop - clientHeight < 200) {
        scrollToBottom();
      }
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
    if (emptyState) return emptyState;

    return (
      <ZView className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
        <p className="opacity-50 text-sm">暂无消息，开始一个新的对话吧</p>
      </ZView>
    );
  };

  const onSendMessage = (content: string) => {
    manager.add({
      role: 'user',
      content,
    });
  };

  return (
    <ZView
      className={cn(
        'flex flex-col min-h-[500px] w-full bg-background overflow-hidden p-3',
        className,
      )}
      {...props}
    >
      <ZView ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {manager.length === 0
          ? renderEmptyState()
          : manager.map((message, index) => (
              <MessageItem key={index} message={message} />
            ))}
        {loading && (
          <ZView className="flex w-full gap-2 justify-start">
            <Loader2 className="w-4 h-4 animate-spin" />
          </ZView>
        )}
      </ZView>
      <MessageInput
        onSend={onSendMessage}
        loading={loading}
        placeholder={placeholder}
      />
    </ZView>
  );
}
