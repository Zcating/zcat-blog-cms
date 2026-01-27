import { Copy, RefreshCw } from 'lucide-react';
import React from 'react';

import { copyToClipboard } from '@zcat/ui/utils';

import { cn } from '../../shadcn/lib/utils';
import { ZButton } from '../z-button/z-button';
import { ZMarkdown } from '../z-markdown';
import { ZNotification } from '../z-notification';
import { ZView } from '../z-view/z-view';

import { MessageImpl, useChatMessage } from './use-chat-message';

interface CommonBubbleProps {
  message: MessageImpl;
}

interface AssistantBubbleProps extends CommonBubbleProps {
  regenerable?: boolean;
  onRegenerate?: (message: MessageImpl) => void | Promise<void>;
}

const UserBubble = React.memo(({ message }: CommonBubbleProps) => {
  const content = useChatMessage(message, 'content');
  return (
    <ZView className="flex w-full gap-2 justify-end">
      <ZView
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-muted',
        )}
      >
        {content}
      </ZView>
    </ZView>
  );
});

UserBubble.displayName = 'UserBubble';

const AssistantBubble = React.memo(
  ({ message, regenerable, onRegenerate }: AssistantBubbleProps) => {
    const content = useChatMessage(message, 'content');
    const onCopy = async () => {
      const text = content ?? '';
      if (!text) {
        return;
      }
      try {
        await copyToClipboard(text);
        await ZNotification.success('已复制');
      } catch {
        await ZNotification.error('复制失败');
      }
    };

    const isFinish = useChatMessage(message, 'isFinish');

    return (
      <ZView className="flex flex-col w-full gap-2 justify-start items-center">
        <ZMarkdown className="w-full" content={content} />
        {!isFinish && (
          <ZView className="flex w-full justify-start">
            <div className="flex items-center gap-1 text-muted-foreground text-sm">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-75" />
              <div className="w-2 h-2 bg-current rounded-full animate-pulse delay-150" />
            </div>
          </ZView>
        )}
        <ZView className="flex w-full items-center gap-2 justify-start">
          {!!isFinish && (
            <>
              <ZButton
                size="sm"
                variant="ghost"
                onClick={() => void onCopy()}
                tooltip="复制"
              >
                <Copy size={14} />
              </ZButton>
              {regenerable && (
                <ZButton
                  size="sm"
                  variant="ghost"
                  onClick={() => void onRegenerate?.(message)}
                  tooltip="重新生成"
                >
                  <RefreshCw size={14} />
                </ZButton>
              )}
            </>
          )}
        </ZView>
      </ZView>
    );
  },
);

AssistantBubble.displayName = 'AssistantBubble';

const patterns = {
  user: UserBubble,
  assistant: AssistantBubble,
  system: () => null,
  function: () => null,
};

export function ZChatBubble({
  message,
  regenerable,
  onRegenerate,
}: {
  message: MessageImpl;
  regenerable?: boolean;
  onRegenerate?: (message: MessageImpl) => void | Promise<void>;
}) {
  const Component = patterns[message.role];
  return (
    <Component
      message={message}
      regenerable={regenerable}
      onRegenerate={onRegenerate}
    />
  );
}
