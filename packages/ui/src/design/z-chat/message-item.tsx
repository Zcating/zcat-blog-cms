import { Copy, RefreshCw } from 'lucide-react';
import React from 'react';

import { useUpdate, useWatch } from '@zcat/ui/hooks';
import { copyToClipboard } from '@zcat/ui/utils';

import { cn } from '../../shadcn/lib/utils';
import { ZButton } from '../z-button/z-button';
import { ZMarkdown } from '../z-markdown';
import { ZMessage } from '../z-message';
import { ZView } from '../z-view/z-view';

import { subscribeMessage } from './observable-message';

import type { Message } from './z-chat';

function useMessageSubscription(message: Message) {
  const update = useUpdate();

  useWatch([message], (current) => {
    return subscribeMessage(current, () => {
      update();
    });
  });
}

const UserMessage = React.memo(
  ({
    message,
  }: {
    message: Message;
    onRegenerate?: (message: Message) => void | Promise<void>;
  }) => {
    useMessageSubscription(message);
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
  },
);
UserMessage.displayName = 'UserMessage';

const AssistantMessage = React.memo(
  ({
    message,
    onRegenerate,
  }: {
    message: Message;
    onRegenerate?: (message: Message) => void | Promise<void>;
  }) => {
    useMessageSubscription(message);

    const onCopy = async () => {
      const text = message.content ?? '';
      if (!text) {
        return;
      }
      try {
        await copyToClipboard(text);
        await ZMessage.success('已复制');
      } catch {
        await ZMessage.error('复制失败');
      }
    };

    return (
      <ZView className="flex flex-col w-full gap-2 justify-start items-center">
        <ZMarkdown className="w-full" content={message.content} />
        {!message.isFinish && (
          <ZView className="flex w-full justify-start">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150" />
            </div>
          </ZView>
        )}
        <ZView className="flex w-full items-center gap-2 justify-start">
          {message.isFinish && (
            <>
              <ZButton
                size="sm"
                variant="ghost"
                onClick={() => void onCopy()}
                tooltip="复制"
              >
                <Copy size={14} />
              </ZButton>
              <ZButton
                size="sm"
                variant="ghost"
                onClick={() => void onRegenerate?.(message)}
                tooltip="重新生成"
              >
                <RefreshCw size={14} />
              </ZButton>
            </>
          )}
        </ZView>
      </ZView>
    );
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
  onRegenerate,
}: {
  message: Message;
  onRegenerate?: (message: Message) => void | Promise<void>;
}) {
  const Component = patterns[message.role];
  return <Component message={message} onRegenerate={onRegenerate} />;
}
