import { Copy } from 'lucide-react';
import React from 'react';

import { useUpdate, useWatch } from '@zcat/ui/hooks';
import { copyToClipboard } from '@zcat/ui/utils';

import { cn } from '../../shadcn/lib/utils';
import { Button } from '../../shadcn/ui/button';
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

const UserMessage = React.memo(({ message }: { message: Message }) => {
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
});
UserMessage.displayName = 'UserMessage';

const AssistantMessage = React.memo(({ message }: { message: Message }) => {
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
      <ZView className="flex w-full items-center gap-2 justify-end">
        {message.isFinish && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => void onCopy()}
          >
            <Copy size={14} />
            <span>复制</span>
          </Button>
        )}
      </ZView>
    </ZView>
  );
});

AssistantMessage.displayName = 'AssistantMessage';

const patterns = {
  user: UserMessage,
  assistant: AssistantMessage,
  system: () => null,
  function: () => null,
};

export function MessageItem({ message }: { message: Message }) {
  const Component = patterns[message.role];
  return <Component message={message} />;
}
