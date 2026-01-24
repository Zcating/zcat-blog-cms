import { ChevronsDown, MessageSquare } from 'lucide-react';
import React from 'react';

import { isFunction, safeReactNode } from '@zcat/ui/utils';

import { ShrinkDownAnimation } from '../../animation';
import { cn } from '../../shadcn/lib/utils';
import { ZButton } from '../z-button/z-button';
import { ZView } from '../z-view/z-view';

import { MessageInput } from './message-input';
import { MessageItem } from './message-item';
import { observeMessage } from './observable-message';
import { useChatAutoScroll } from './use-chat-auto-scroll';

export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  isFinish?: boolean;
}

export interface ZChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[];
  onSend: (message: Message) => void | Promise<void>;
  onRegenerate?: (message: Message) => void | Promise<void>;
  onAbort?: () => void;
  placeholder?: string;
  toolbar?: React.ReactNode | React.ComponentType;
  toolbarClassName?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export function createObservableMessage(message: Message): Message {
  return observeMessage(message);
}

export function ZChat({
  messages,
  onSend,
  onAbort,
  onRegenerate,
  placeholder = 'Type a message...',
  className,
  toolbar,
  toolbarClassName,
  emptyComponent: emptyState,
  ...props
}: ZChatProps) {
  const renderedMessages = React.useMemo(() => {
    return messages.map(observeMessage);
  }, [messages]);

  const { scrollRef, isAtBottom, updateIsAtBottom, lockToBottom } =
    useChatAutoScroll();

  const hasToolbar = Boolean(toolbar) || isFunction(toolbar);
  const renderToolbar = () => safeReactNode(toolbar, () => null);
  const renderEmptyState = () => safeReactNode(emptyState, DefaultEmptyState);

  const { handleSend, handleAbort, handleRegenerate, loading } = useSender(
    onSend,
    onAbort,
    onRegenerate,
  );

  return (
    <ZView
      className={cn(
        'relative flex flex-col h-full w-full items-center',
        className,
      )}
      {...props}
    >
      {hasToolbar ? (
        <ZView className={cn('w-full shrink-0', toolbarClassName)}>
          {renderToolbar()}
        </ZView>
      ) : null}
      <ZView
        ref={scrollRef}
        className="w-full flex-1 overflow-y-auto space-y-6 z-scrollbar py-4 px-4 md:px-20 lg:px-40"
        onScroll={updateIsAtBottom}
      >
        {renderedMessages.length === 0
          ? renderEmptyState()
          : renderedMessages.map((message, index) => (
              <MessageItem
                key={message.id ?? index}
                message={message}
                onRegenerate={handleRegenerate}
              />
            ))}
      </ZView>
      <ZView className="relative">
        <ShrinkDownAnimation
          show={!isAtBottom}
          className="absolute -top-12 left-[50%] translate-x-[-50%]"
        >
          <ZButton
            variant="outline"
            onClick={lockToBottom}
            className="rounded-full size-8"
          >
            <ChevronsDown className="size-4" />
          </ZButton>
        </ShrinkDownAnimation>
        <MessageInput
          onSend={handleSend}
          onAbort={handleAbort}
          loading={loading}
          placeholder={placeholder}
        />
      </ZView>
    </ZView>
  );
}

function DefaultEmptyState() {
  return (
    <ZView className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
      <p className="opacity-50 text-sm">暂无消息，开始一个新的对话吧</p>
    </ZView>
  );
}

function useSender(
  onSend: ZChatProps['onSend'],
  onAbort?: ZChatProps['onAbort'],
  onRegenerate?: ZChatProps['onRegenerate'],
) {
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
    setLoading(false);
    if (!isFunction(onAbort)) {
      return;
    }
    onAbort();
  };

  const handleRegenerate = async (message: Message) => {
    setLoading(true);
    try {
      if (!isFunction(onRegenerate)) {
        return;
      }
      const result = onRegenerate?.(message);
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSend,
    handleAbort,
    handleRegenerate,
    loading,
  };
}
