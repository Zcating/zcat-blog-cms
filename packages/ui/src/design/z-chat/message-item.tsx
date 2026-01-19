import React from 'react';

import { cn } from '../../shadcn/lib/utils';
import { ZMarkdown } from '../z-markdown';
import { ZView } from '../z-view/z-view';

import type { Message } from './z-chat';

function useStreamContent(content: string | ReadableStream) {
  const [data, setData] = React.useState<string>(
    typeof content === 'string' ? content : '',
  );

  React.useEffect(() => {
    if (typeof content === 'string') {
      setData(content);
      return;
    }

    if (content.locked) {
      return;
    }

    // Reset content for new stream
    setData('');

    const isActive = true;
    let reader: ReadableStreamDefaultReader | undefined;

    try {
      reader = content.getReader();
    } catch (e) {
      console.error('Failed to get reader:', e);
      return;
    }

    const decoder = new TextDecoder();

    const read = async () => {
      if (!reader) {
        return;
      }

      try {
        while (isActive) {
          const data = await reader.read();
          if (data.done) {
            break;
          }
          const chunk = decoder.decode(data.value, { stream: true });
          setData((prev) => prev + chunk);
        }
      } catch (error) {
        console.error('Stream reading error:', error);
      } finally {
        // In Strict Mode, we want to release lock instead of cancel if possible,
        // so that the next effect can pick up the stream.
        // However, if we are truly unmounting, we should cancel.
        // Since we can't distinguish, we prefer releasing lock to support Strict Mode.
        // But if the stream is infinite, this might leak.
        // For now, we prioritize Strict Mode compatibility.
        if (reader) {
          try {
            reader.releaseLock();
          } catch (e) {
            console.warn('Failed to release lock:', e);
          }
        }
      }
    };

    read();

    // return () => {
    //   isActive = false;
    // };
  }, [content]);

  return data;
}

const UserMessage = ({ message }: { message: Message }) => {
  const content = useStreamContent(message.content);

  return (
    <ZView className="flex w-full gap-2 justify-end">
      <ZView
        className={cn(
          'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap bg-muted',
        )}
      >
        {content}
        {message.time && (
          <ZView className="text-[10px] opacity-70 mt-1 text-right">
            {message.time}
          </ZView>
        )}
      </ZView>
    </ZView>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
  const content = useStreamContent(message.content);

  return (
    <ZView className="flex w-full gap-2 justify-start">
      <ZMarkdown content={content} />
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

export function MessageItem({ message }: { message: Message }) {
  const Component = patterns[message.role];
  return <Component message={message} />;
}
