import {
  type Message,
  MessageImpl,
  useMemoizedFn,
  useToggleValue,
  useZChatController,
} from '@zcat/ui';
import React from 'react';

import {
  createChatHistory,
  getChatHistory,
  updateChatHistory,
} from '../ai-chat-history/chat-history-storage';

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

  const currentHistoryIdRef = React.useRef<string | null>(null);

  const systemMessage = React.useMemo(() => {
    return {
      role: 'system',
      content:
        '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
    } as const;
  }, []);

  const abort = useMemoizedFn(async (reason: string) => {
    const chatHandler = chatHandlerRef.current;
    const assistantMessage = assistantMessageHandlerRef.current;
    if (!assistantMessage || !chatHandler) {
      return;
    }

    chatHandler.abort(reason);
    assistantMessage.setFinish(true);
    assistantMessage.setContent('用户暂停生成');

    await saveCurrentHistory();
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
        assistantMessage.setFinish(true);
        assistantMessage.setContent('请求失败');
      }
    },
  );

  const saveCurrentHistory = useMemoizedFn(async () => {
    const messages = controller.json();
    if (messages.length === 0 || !currentHistoryIdRef.current) {
      return;
    }

    await updateChatHistory(currentHistoryIdRef.current, {
      messages,
    });
  });

  const loadHistory = useMemoizedFn(async (historyId: string) => {
    const history = await getChatHistory(historyId);
    if (!history) {
      return false;
    }

    controller.clear();
    history.messages.forEach((msg) => controller.add(msg));
    currentHistoryIdRef.current = historyId;

    return true;
  });

  const startNewChat = useMemoizedFn(() => {
    controller.clear();
    currentHistoryIdRef.current = null;
  });

  const send = useMemoizedFn(async (message: Message) => {
    const result = await apiKeyPromption(model);
    if (!result) {
      return false;
    }

    if (!currentHistoryIdRef.current) {
      const newHistory = await createChatHistory({
        messages: [message],
      });
      currentHistoryIdRef.current = newHistory.id;
    } else {
      await saveCurrentHistory();
    }

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

    chatHandlerRef.current.create().then((stream) => {
      const assistantMessage: MessageImpl = controller.add({
        id: createMessageId(),
        role: 'assistant',
        content: '',
      });

      assistantMessageHandlerRef.current = assistantMessage;

      return runAssistantStream(stream, assistantMessage).then(() => {
        saveCurrentHistory();
      });
    });

    return true;
  });

  const regenerate = useMemoizedFn(async () => {
    const chatHandler = chatHandlerRef.current;
    const assistantMessage = assistantMessageHandlerRef.current;
    if (!assistantMessage || !chatHandler) {
      return;
    }

    assistantMessage.reset();

    const stream = await chatHandler.create();

    await runAssistantStream(stream, assistantMessage);
    await saveCurrentHistory();
  });

  return {
    controller,
    send,
    abort,
    regenerate,
    deepThinking,
    toggleDeepThinking,
    loadHistory,
    startNewChat,
    saveCurrentHistory,
    currentHistoryId: currentHistoryIdRef.current,
  };
}
