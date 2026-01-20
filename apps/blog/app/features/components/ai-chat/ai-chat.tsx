import {
  createObservableMessage,
  useMemoizedFn,
  ZChat,
  type Message,
} from '@zcat/ui';
import React from 'react';

// import { AiApi } from '@blog/apis';
import { AiApiMock as AiApi } from '@blog/apis/interfaces/ai-api.mock';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode;
}

function createMessageId() {
  return (
    globalThis.crypto?.randomUUID?.() ??
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function useChatMessages() {
  const [messages, setMessages] = React.useState<Message[]>([]);

  const addMessage = useMemoizedFn((message: Message) => {
    const next = [...messages, message];
    setMessages(next);
    return next;
  });

  return [messages, setMessages, addMessage] as const;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const [messages, setMessages, addMessage] = useChatMessages();

  const [chatHandler] = React.useState(AiApi.chat);

  const handleSendMessage = async (message: Message) => {
    const userMessage: Message = { ...message, id: createMessageId() };
    const result = addMessage(userMessage);

    const stream = await chatHandler.create([
      {
        role: 'system',
        content:
          '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
      },
      ...result,
    ]);
    const assistantId = createMessageId();
    const assistantMessage: Message = createObservableMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
    });
    addMessage(assistantMessage);

    for await (const message of stream) {
      assistantMessage.content += message.content;
    }
    assistantMessage.isFinish = true;
  };

  const handleAbort = () => {
    chatHandler.abort('用户取消');

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      return;
    }
    setMessages((prev) => prev.filter((msg) => msg !== lastMessage));
  };

  console.log('fuck', 'should render once');
  return (
    <ZChat
      className={className}
      messages={messages}
      onSend={handleSendMessage}
      onAbort={handleAbort}
      placeholder="问问都有什么工具..."
      emptyComponent={emptyComponent}
    />
  );
}
