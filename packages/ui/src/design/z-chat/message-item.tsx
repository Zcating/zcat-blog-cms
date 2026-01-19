import { useEffect, useState } from 'react';

import { cn } from '../../shadcn/lib/utils';
import { ZMarkdown } from '../z-markdown';
import { ZView } from '../z-view/z-view';

import type { Message } from './z-chat';

function useStreamContent(content: string | ReadableStream) {
  const [data, setData] = useState<string>(
    typeof content === 'string' ? content : '',
  );

  useEffect(() => {
    if (typeof content === 'string') {
      setData(content);
      return;
    }

    if (content.locked) {
      return;
    }

    // Reset content for new stream
    setData('');

    let isActive = true;
    let reader: ReadableStreamDefaultReader | undefined;

    try {
      reader = content.getReader();
    } catch (e) {
      console.error('Failed to get reader:', e);
      return;
    }

    const decoder = new TextDecoder();

    const read = async () => {
      if (!reader) return;

      try {
        while (isActive) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!isActive) break;
          const chunk = decoder.decode(value, { stream: true });
          setData((prev) => prev + chunk);
        }
      } catch (error) {
        console.error('Stream reading error:', error);
      } finally {
        if (!isActive) {
          try {
            await reader.cancel();
          } catch {
            // ignore
          }
        } else {
          reader.releaseLock();
        }
      }
    };

    read();

    return () => {
      isActive = false;
      // We don't cancel here immediately because 'read' loop might be awaiting.
      // The finally block in 'read' will handle cleanup when it wakes up or finishes.
      // However, to prevent memory leaks if read() is stuck, we might want to force cancel?
      // But we can't force cancel easily without the reader instance.
      // The current logic relies on 'isActive' flag and the next 'await' resolving.
    };
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
