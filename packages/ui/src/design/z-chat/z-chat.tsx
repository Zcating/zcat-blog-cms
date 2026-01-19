import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../shadcn/lib/utils';
import { ZView } from '../z-view/z-view';

import { MessageInput } from './message-input';
import { MessageItem } from './message-item';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string | ReadableStream;
  time?: string;
}

export interface ZChatProps extends React.HTMLAttributes<HTMLDivElement> {
  messages: Message[];
  onSendMessage: (message: string) => void;
  loading?: boolean;
  placeholder?: string;
}

export function ZChat({
  messages,
  onSendMessage,
  loading = false,
  placeholder = 'Type a message...',
  className,
  ...props
}: ZChatProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <ZView
      className={cn(
        'flex flex-col h-[500px] w-full border rounded-lg bg-background overflow-hidden',
        className,
      )}
      {...props}
    >
      <ZView className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageItem key={message.id} message={message} />
        ))}
        {loading && (
          <ZView className="flex w-full gap-2 justify-start">
            <Loader2 className="w-4 h-4 animate-spin" />
          </ZView>
        )}
        <ZView ref={messagesEndRef} />
      </ZView>
      <MessageInput
        onSendMessage={onSendMessage}
        loading={loading}
        placeholder={placeholder}
      />
    </ZView>
  );
}
