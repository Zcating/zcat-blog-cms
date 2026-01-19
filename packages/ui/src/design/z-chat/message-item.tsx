import React from 'react';

import { useMount } from '@zcat/ui/hooks';

import { cn } from '../../shadcn/lib/utils';
import { ZMarkdown } from '../z-markdown';
import { ZView } from '../z-view/z-view';

import { ZChatMessage } from './z-chat-manager';

const UserMessage = ({ message }: { message: ZChatMessage }) => {
  return (
    <ZView className="flex w-full gap-2 justify-end">
      <ZView
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-muted',
        )}
      >
        {message.content}
        {message.time && (
          <ZView className="text-[10px] opacity-70 mt-1 text-right">
            {message.time}
          </ZView>
        )}
      </ZView>
    </ZView>
  );
};

const AssistantMessage = ({ message }: { message: ZChatMessage }) => {
  const [content, setContent] = React.useState(message.content);

  useMount(() => {
    return message.addListener(setContent);
  });

  return (
    <ZView className="flex w-full gap-2 justify-start">
      <ZMarkdown className="w-full" content={content} />
      <ZView className="text-[10px] opacity-70 mt-1 text-right">
        {message.time}
      </ZView>
    </ZView>
  );
};

const patterns = {
  user: UserMessage,
  assistant: AssistantMessage,
};

export function MessageItem({ message }: { message: ZChatMessage }) {
  const Component = patterns[message.role];
  return <Component message={message} />;
}
