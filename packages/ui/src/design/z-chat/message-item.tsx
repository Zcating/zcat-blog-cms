import { Bot, User } from 'lucide-react';

import { cn } from '../../shadcn/lib/utils';
import { ZMarkdown } from '../z-markdown';
import { ZView } from '../z-view/z-view';

import type { Message } from './z-chat';

const Avatar = ({ role }: { role: 'user' | 'assistant' }) => {
  if (role === 'user') {
    return (
      <ZView className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
        <User className="w-5 h-5 text-primary-foreground" />
      </ZView>
    );
  }
  return (
    <ZView className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
      <Bot className="w-5 h-5 text-primary" />
    </ZView>
  );
};

const MessageBubble = ({ message }: { message: Message }) => {
  const isUser = message.role === 'user';
  return (
    <ZView
      className={cn(
        'max-w-[80%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap',
        isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
      )}
    >
      <ZMarkdown content={message.content} />
      {message.time && (
        <ZView className="text-[10px] opacity-70 mt-1 text-right">
          {message.time}
        </ZView>
      )}
    </ZView>
  );
};

const UserMessage = ({ message }: { message: Message }) => {
  return (
    <ZView className="flex w-full gap-2 justify-end">
      <MessageBubble message={message} />
      <Avatar role="user" />
    </ZView>
  );
};

const AssistantMessage = ({ message }: { message: Message }) => {
  return (
    <ZView className="flex w-full gap-2 justify-start">
      <Avatar role="assistant" />
      <MessageBubble message={message} />
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
