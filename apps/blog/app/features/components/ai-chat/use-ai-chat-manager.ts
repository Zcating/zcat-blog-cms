import {
  MessageImpl,
  useMemoizedFn,
  useToggleValue,
  useZChatController,
  type Message,
} from '@zcat/ui';
import React from 'react';

import { AiApi } from './ai-api';
import { apiKeyPromption, type ApiModelName } from './ai-model-utils';

import type { Stream } from '../../utils';

function createMessageId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function useAiChatManager(model?: ApiModelName) {
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
    const result = await apiKeyPromption(model);
    if (!result) {
      return;
    }

    // API密钥已存在或已成功设置，继续发送消息
    controller.add({
      ...message,
      id: createMessageId(),
    });

    chatHandlerRef.current = AiApi.chat(
      result.model,
      result.apiKey,
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
