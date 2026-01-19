import { Send, Loader2, Bot } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../shadcn/lib/utils';
import { ZButton } from '../z-button/z-button';
import { ZTextarea } from '../z-textarea/z-textarea';
import { ZView } from '../z-view/z-view';

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
  const [inputValue, setInputValue] = React.useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim() && !loading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  };

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
      <ZView className="p-4 border-t bg-muted/30 flex gap-2 items-end">
        <ZTextarea
          value={inputValue}
          onValueChange={setInputValue}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={loading}
          className="flex-1 min-h-[40px] resize-none"
          rows={1}
        />
        <ZButton
          onClick={handleSend}
          disabled={loading || !inputValue.trim()}
          size="icon"
          className="shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </ZButton>
      </ZView>
    </ZView>
  );
}
