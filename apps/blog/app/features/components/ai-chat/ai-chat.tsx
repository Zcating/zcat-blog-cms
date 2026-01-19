import { useZChatManager, ZChat, type Message } from '@zcat/ui';
import dayjs from 'dayjs';
import React from 'react';

let i = 0;
function createId() {
  return `${i++}`;
}

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [loading, setLoading] = React.useState(false);

  const handleSendMessage = (message: string) => {
    setMessages([
      ...messages,
      {
        id: createId(),
        role: 'user',
        content: message,
        time: dayjs().format('HH:mm'),
      },
    ]);
    setLoading(true);
  };

  const manager = useZChatManager();

  return (
    <ZChat
      className={className}
      manager={manager}
      loading={loading}
      onSend={handleSendMessage}
      placeholder='输入消息，或输入 "/markdown"'
      emptyComponent={emptyComponent}
    />
  );
}
