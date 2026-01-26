import {
  cn,
  createObservableMessage,
  useMemoizedFn,
  ZSelect,
  ZChat,
  Toggle,
  type Message,
  useBoolean,
  useToggleValue,
} from '@zcat/ui';
import { AtomIcon } from 'lucide-react';
import React from 'react';

// import { AiApiMock as AiApi } from '@blog/apis/interfaces/ai-api.mock';
import { AiApi } from './ai-api';
import {
  type ApiModelName,
  API_MODELS,
  apiKeyPromption,
  getApiKey,
} from './ai-model-utils';

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
  const addMessage = useMemoizedFn((message: Message) => {
    const next = [...messagesRef.current, message];
    setMessages(next);
    return next;
  });

  return [messages, setMessages, addMessage] as const;
}

function useAiChatManager(model: ApiModelName) {
  const [deepThinking, toggleDeepThinking] = useToggleValue(false);
  const [messages, setMessages, addMessage] = useChatMessages();

  const chatHandlerRef = React.useRef<ReturnType<typeof AiApi.chat> | null>(
    null,
  );

  const systemMessage = React.useMemo(() => {
    return {
      role: 'system',
      content:
        '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
    } as const;
  }, []);

  const abort = useMemoizedFn((reason: string) => {
    chatHandlerRef.current?.abort(reason);

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role === 'user') {
      return;
    }
    lastMessage.isFinish = true;
    lastMessage.content = '用户暂停生成';
  });

  const runAssistantStream = useMemoizedFn(async (chatMessages: Message[]) => {
    chatHandlerRef.current = AiApi.chat(model, getApiKey(model));
    const assistantMessage = messages[messages.length - 1];
    if (!assistantMessage || assistantMessage.role !== 'assistant') {
      return;
    }
    assistantMessage.content = '';
    assistantMessage.isFinish = false;
    try {
      const stream = await chatHandlerRef.current.create(
        [systemMessage, ...chatMessages],
        deepThinking,
      );
      let isThinking = false;
      for await (const message of stream) {
        if (message.thinking) {
          if (!isThinking) {
            isThinking = true;
            assistantMessage.content += '```think\n';
          }
          assistantMessage.content += message.thinking;
          continue;
        }
        if (isThinking) {
          assistantMessage.content += '\n```\n';
          isThinking = false;
        }
        assistantMessage.content += message.content;
      }

      assistantMessage.isFinish = true;
    } catch (error) {
      console.error('请求失败:', error);
      assistantMessage.isFinish = true;
      assistantMessage.content = '请求失败';
      return;
    }
  });

  const send = useMemoizedFn(async (message: Message) => {
    const isSuccess = await apiKeyPromption(model);
    if (!isSuccess) {
      return;
    }

    // API密钥已存在或已成功设置，继续发送消息
    const userMessage: Message = { ...message, id: createMessageId() };
    const result = addMessage(userMessage);
    const assistantMessage: Message = createObservableMessage({
      id: createMessageId(),
      role: 'assistant',
      content: '',
    });
    addMessage(assistantMessage);
    await runAssistantStream(result);
  });

  const regenerate = useMemoizedFn(async (message: Message) => {
    if (message.role !== 'assistant') {
      return;
    }

    chatHandlerRef.current?.abort('用户重新生成');

    const index = messages.findIndex((m) => m.id && m.id === message.id);
    if (index === -1) {
      return;
    }

    const nextMessages = messages.slice(0, index + 1);
    setMessages(nextMessages);

    const contextMessages = nextMessages.slice(0, index);
    await runAssistantStream(message, contextMessages);
  });

  return {
    messages,
    send,
    abort,
    regenerate,
    deepThinking,
    toggleDeepThinking,
  } as const;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const [model, setModel] = React.useState<ApiModelName>('deepseek');

  const chat = useAiChatManager(model);

  return (
    <ZChat
      className={cn('overflow-hidden', className)}
      messages={chat.messages}
      onSend={chat.send}
      onAbort={() => chat.abort('用户取消')}
      onRegenerate={chat.regenerate}
      placeholder="问问都有什么工具..."
      emptyComponent={emptyComponent}
      toolbar={
        <div className="flex items-center gap-2">
          <ZSelect
            placeholder="选择模型"
            options={API_MODELS}
            value={model}
            onValueChange={setModel}
          />
          <Toggle
            variant="outline"
            size="sm"
            pressed={chat.deepThinking}
            onPressedChange={chat.toggleDeepThinking}
            aria-label="开启深度思考模式，AI将提供更详细全面的分析"
          >
            <AtomIcon className="size-4" />
            <p>深度思考</p>
          </Toggle>
        </div>
      }
    />
  );
}
