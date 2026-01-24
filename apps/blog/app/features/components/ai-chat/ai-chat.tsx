import {
  cn,
  createObservableMessage,
  useMemoizedFn,
  ZSelect,
  ZChat,
  Toggle,
  type Message,
} from '@zcat/ui';
import { Brain } from 'lucide-react';
import React from 'react';

import { AiApi } from '@blog/apis';
// import { AiApiMock as AiApi } from '@blog/apis/interfaces/ai-api.mock';

import { showApiKeyDialog, showApiKeyMissingDialog } from './api-key-dialog';
import { checkApiKey, saveApiKey, type ApiModelName } from './api-key-utils';

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

function useAiChatManager(model: ApiModelName) {
  const [messages, setMessages, addMessage, getMessages] = useChatMessages();
  const [deepThinking, setDeepThinking] = React.useState(false);

  const chatHandlerRef = React.useRef<ReturnType<typeof AiApi.chat> | null>(
    null,
  );

  const systemMessage = React.useMemo(() => {
    const baseContent =
      '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。';
    const deepThinkingContent = deepThinking
      ? ' 请对用户的问题进行深度思考，提供更详细、更全面的分析，包括多个角度的思考、潜在的解决方案、以及相关的背景知识。'
      : '';

    return {
      role: 'system',
      content: baseContent + deepThinkingContent,
    } as const;
  }, [deepThinking]);

  const abort = useMemoizedFn((reason: string) => {
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
      const chatHandler = AiApi.chat(model);

      assistantMessage.content = '';
      assistantMessage.isFinish = false;
      try {
        const stream = await chatHandler.create([
          systemMessage,
          ...chatMessages,
        ]);
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
    },
  );

  const send = useMemoizedFn(async (message: Message) => {
    // 检查API密钥是否存在
    const hasApiKey = checkApiKey(model);

    if (!hasApiKey) {
      // 显示API密钥缺失提示

      const shouldSetup = await showApiKeyMissingDialog(model);

      if (!shouldSetup) {
        // 用户选择稍后设置，不发送消息
        return;
      }

      // 显示API密钥输入弹窗
      const result = await showApiKeyDialog(model);

      if (!result.confirmed || !result.apiKey) {
        // 用户取消输入，不发送消息
        return;
      }

      // 保存API密钥
      try {
        saveApiKey(model, result.apiKey);
      } catch (error) {
        // 保存失败，不发送消息
        console.error('保存API密钥失败:', error);
        return;
      }
    }

    // API密钥已存在或已成功设置，继续发送消息
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

  const toggleDeepThinking = useMemoizedFn(() => {
    setDeepThinking((prev) => !prev);
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
          <Toggle
            variant="outline"
            size="sm"
            pressed={chat.deepThinking}
            onPressedChange={chat.toggleDeepThinking}
            aria-label="开启深度思考模式，AI将提供更详细全面的分析"
          >
            <Brain className="size-4" />
          </Toggle>
          <ZSelect
            placeholder="选择模型"
            options={[{ value: 'deepseek', label: 'DeepSeek Chat' }]}
            value={model}
            onValueChange={setModel}
          />
        </div>
      }
    />
  );
}
