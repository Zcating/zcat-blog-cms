import { ChevronsDown, MessageSquare } from 'lucide-react';
import React from 'react';

import { isFunction, safeReactNode } from '@zcat/ui/utils';

import { ShrinkDownAnimation } from '../../animation';
import { cn } from '../../shadcn/lib/utils';
import { ZButton } from '../z-button/z-button';
import { ZView } from '../z-view/z-view';

import { MessageInput } from './message-input';
import { useChatAutoScroll } from './use-chat-auto-scroll';
import { ZChatController } from './use-chat-controller';
import { Message } from './use-chat-message';
import { useChatMessages } from './use-chat-messages';
import { useZChatSender } from './use-chat-sender';
import { ZChatBubble } from './z-chat-bubble';

export interface ZChatProps extends React.HTMLAttributes<HTMLDivElement> {
  controller: ZChatController;
  onSend: (message: Message) => boolean | Promise<boolean>;
  onRegenerate?: () => void | Promise<void>;
  onAbort?: () => void;
  placeholder?: string;
  toolbar?: React.ReactNode;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export function ZChat({
  controller,
  onSend,
  onAbort,
  onRegenerate,
  placeholder = 'Type a message...',
  className,
  toolbar,
  emptyComponent: emptyState,
  ...props
}: ZChatProps) {
  const { scrollRef, isAtBottom, updateIsAtBottom, lockToBottom } =
    useChatAutoScroll();

  const renderEmptyState = () => safeReactNode(emptyState, DefaultEmptyState);

  const { handleSend, handleAbort, handleRegenerate, loading } = useZChatSender(
    onSend,
    onAbort,
    onRegenerate,
  );

  const messages = useChatMessages(controller);

  return (
    <ZView
      className={cn(
        'relative flex flex-col h-full w-full items-center',
        className,
      )}
      {...props}
    >
      <ZView
        ref={scrollRef}
        className="w-full flex-1 overflow-y-auto space-y-6 z-scrollbar py-4 px-4 md:px-20"
        onScroll={updateIsAtBottom}
      >
        {messages.length === 0
          ? renderEmptyState()
          : messages.map((message, index) => (
              <ZChatBubble
                key={message.id ?? index}
                message={message}
                regenerable={index === messages.length - 1}
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
          toolbar={toolbar}
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
