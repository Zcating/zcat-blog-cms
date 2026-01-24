import {
  cn,
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
  emptyComponent?: React.ReactNode | React.ComponentType;
}

function createMessageId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function useChatMessages() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const messagesRef = React.useRef<Message[]>(messages);

  React.useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const setMessagesSafe = useMemoizedFn(
    (updater: Message[] | ((prev: Message[]) => Message[])) => {
      setMessages((prev) => {
        const next =
          typeof updater === 'function'
            ? (updater as (prev: Message[]) => Message[])(prev)
            : updater;
        messagesRef.current = next;
        return next;
      });
    },
  );

  const addMessage = useMemoizedFn((message: Message) => {
    const next = [...messagesRef.current, message];
    setMessagesSafe(next);
    return next;
  });

  const getMessages = useMemoizedFn(() => messagesRef.current);

  return [messages, setMessagesSafe, addMessage, getMessages] as const;
}

function useAiChatManager() {
  const [messages, setMessages, addMessage, getMessages] = useChatMessages();

  const chatHandlerRef = React.useRef<ReturnType<typeof AiApi.chat> | null>(
    null,
  );
  const activeRequestIdRef = React.useRef(0);

  const systemMessage = React.useMemo(() => {
    return {
      role: 'system',
      content:
        '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
    } as const;
  }, []);

  const abort = useMemoizedFn((reason: string) => {
    activeRequestIdRef.current++;
    chatHandlerRef.current?.abort(reason);

    const current = getMessages();
    const lastMessage = current[current.length - 1];
    if (!lastMessage || lastMessage.role === 'user') {
      return;
    }
    lastMessage.isFinish = true;
    lastMessage.content = '用户暂停生成';
  });

  const runAssistantStream = useMemoizedFn(
    async (assistantMessage: Message, chatMessages: Message[]) => {
      const requestId = ++activeRequestIdRef.current;
      const chatHandler = AiApi.chat();
      chatHandlerRef.current = chatHandler;

      assistantMessage.content = '';
      assistantMessage.isFinish = false;

      let stream: Awaited<ReturnType<typeof chatHandler.create>>;
      try {
        stream = await chatHandler.create([systemMessage, ...chatMessages]);
      } catch {
        if (requestId !== activeRequestIdRef.current) {
          return;
        }
        assistantMessage.isFinish = true;
        assistantMessage.content = '请求失败';
        return;
      }

      if (requestId !== activeRequestIdRef.current) {
        chatHandler.abort('stale request');
        return;
      }

      for await (const message of stream) {
        if (requestId !== activeRequestIdRef.current) {
          break;
        }
        assistantMessage.content += message.content;
      }

      if (requestId === activeRequestIdRef.current) {
        assistantMessage.isFinish = true;
      }
    },
  );

  const send = useMemoizedFn(async (message: Message) => {
    const userMessage: Message = { ...message, id: createMessageId() };
    const result = addMessage(userMessage);
    const assistantId = createMessageId();
    const assistantMessage: Message = createObservableMessage({
      id: assistantId,
      role: 'assistant',
      content: '',
    });
    addMessage(assistantMessage);
    await runAssistantStream(assistantMessage, result);
  });

  const regenerate = useMemoizedFn(async (message: Message) => {
    if (message.role !== 'assistant') {
      return;
    }

    activeRequestIdRef.current++;
    chatHandlerRef.current?.abort('用户重新生成');

    const current = getMessages();
    const index = current.findIndex((m) => m.id && m.id === message.id);
    if (index === -1) {
      return;
    }

    const nextMessages = current.slice(0, index + 1);
    setMessages(nextMessages);

    const contextMessages = nextMessages.slice(0, index);
    await runAssistantStream(message, contextMessages);
  });

  return {
    messages,
    send,
    abort,
    regenerate,
  } as const;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const chat = useAiChatManager();

  return (
    <ZChat
      className={cn('overflow-hidden', className)}
      messages={chat.messages}
      onSend={chat.send}
      onAbort={() => chat.abort('用户取消')}
      onRegenerate={chat.regenerate}
      placeholder="问问都有什么工具..."
      emptyComponent={emptyComponent}
    />
  );
}
