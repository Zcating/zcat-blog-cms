import {
  cn,
  useMemoizedFn,
  ZSelect,
  ZChat,
  Toggle,
  type Message,
  useToggleValue,
  useZChatController,
  MessageImpl,
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

import type { Stream } from '@blog/apis/utils/stream';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

function createMessageId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function useAiChatManager(model: ApiModelName) {
  const controller = useZChatController();

  const [deepThinking, toggleDeepThinking] = useToggleValue(false);

  const chatHandlerRef = React.useRef<ReturnType<typeof AiApi.chat> | null>(
    null,
  );

  const assistantMessageHandlerRef = React.useRef<MessageImpl | null>(null);

  const systemMessage = React.useMemo(() => {
    return {
      role: 'system',
      content:
        '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
    } as const;
  }, []);

  const abort = useMemoizedFn((reason: string) => {
    const chatHandler = chatHandlerRef.current;
    const assistantMessage = assistantMessageHandlerRef.current;
    if (!assistantMessage || !chatHandler) {
      return;
    }

    chatHandler.abort(reason);
    assistantMessage.setFinish(true);
    assistantMessage.setContent('用户暂停生成');
  });

  const runAssistantStream = useMemoizedFn(
    async (
      stream: Stream<AiApi.ChatMessage>,
      assistantMessage: MessageImpl,
    ) => {
      try {
        let isThinking = false;
        for await (const message of stream) {
          if (message.thinking) {
            if (!isThinking) {
              isThinking = true;
              assistantMessage.appendContent('```think\n');
            }
            assistantMessage.appendContent(message.thinking);
            continue;
          }
          if (isThinking) {
            assistantMessage.appendContent('\n```\n');
            isThinking = false;
          }
          assistantMessage.appendContent(message.content);
        }

        assistantMessage.setFinish(true);
      } catch (error) {
        console.error('请求失败:', error);
        assistantMessage.setFinish(true);
        assistantMessage.setContent('请求失败');
        return;
      }
    },
  );

  const send = useMemoizedFn(async (message: Message) => {
    const apiKey = await apiKeyPromption(model);
    if (!apiKey) {
      return;
    }

    // API密钥已存在或已成功设置，继续发送消息
    controller.add({
      ...message,
      id: createMessageId(),
    });

    chatHandlerRef.current = AiApi.chat(
      model,
      apiKey,
      [systemMessage, ...controller.json()],
      deepThinking,
    );

    const stream = await chatHandlerRef.current.create();

    const assistantMessage: MessageImpl = controller.add({
      id: createMessageId(),
      role: 'assistant',
      content: '',
    });

    assistantMessageHandlerRef.current = assistantMessage;

    runAssistantStream(stream, assistantMessage);
  });

  const regenerate = useMemoizedFn(async () => {
    const chatHandler = chatHandlerRef.current;
    const assistantMessage = assistantMessageHandlerRef.current;
    if (!assistantMessage || !chatHandler) {
      return;
    }

    assistantMessage.reset();

    const stream = await chatHandler.create();

    runAssistantStream(stream, assistantMessage);
  });

  return {
    controller,
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
      controller={chat.controller}
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
