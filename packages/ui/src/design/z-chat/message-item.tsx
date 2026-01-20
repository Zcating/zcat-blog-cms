import { Copy, Loader2 } from 'lucide-react';
import React from 'react';

import { isFunction } from '@zcat/ui/utils';

import { cn } from '../../shadcn/lib/utils';
import { Button } from '../../shadcn/ui/button';
import { ZMarkdown } from '../z-markdown';
import { ZView } from '../z-view/z-view';

import type { Message } from './z-chat';

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <ZView className="flex w-full gap-2 justify-end">
      <ZView
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-muted',
        )}
      >
        {message.content}
      </ZView>
    </ZView>
  );
};

const AssistantMessage = React.memo(
  ({
    message,
    onCopyAssistant,
  }: {
    message: Message;
    onCopyAssistant?: (message: Message) => void | Promise<void>;
  }) => {
    return (
      <ZView className="flex flex-col w-full gap-2 justify-start">
        <ZMarkdown className="w-full" content={message.content} />
        <ZView className="flex w-full items-center gap-2 justify-end">
          {isFunction(onCopyAssistant) && !!message.content && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onCopyAssistant(message)}
            >
              <Copy size={14} />
              <span>复制</span>
            </Button>
          )}
          {!message.isFinish && <Loader2 className="w-4 h-4 animate-spin" />}
        </ZView>
      </ZView>
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.message;
    const next = nextProps.message;
    const isSameContent = prev.content === next.content;
    const isSameFinish = prev.isFinish === next.isFinish;
    const isSameCopyHandler =
      prevProps.onCopyAssistant === nextProps.onCopyAssistant;
    return isSameContent && isSameFinish && isSameCopyHandler;
  },
);

AssistantMessage.displayName = 'AssistantMessage';

const patterns = {
  user: UserMessage,
  assistant: AssistantMessage,
  system: () => null,
  function: () => null,
};

export function MessageItem({
  message,
  onCopyAssistant,
}: {
  message: Message;
  onCopyAssistant?: (message: Message) => void | Promise<void>;
}) {
  const Component = patterns[message.role];
  return <Component message={message} onCopyAssistant={onCopyAssistant} />;
}
