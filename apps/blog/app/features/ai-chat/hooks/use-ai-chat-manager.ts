import { useMount, useZChatController, type Message } from '@zcat/ui';
import React from 'react';

import { AiConversationApi, type ChatHistorySummary } from '../apis';
import { AiApi } from '../apis/ai-api';
import { useChatHistoryStore } from '../stores';
import { ChatTaskQuery, type ChatEvent } from '../utils';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
} as const;

interface ChatParams {
  conversationId: string;
  model: AiApi.ChatModelName;
  deepThinking: boolean;
  messages: AiApi.ChatMessage[];
}

interface ChatHandler {
  start: (callback: (event: ChatEvent) => void) => Teardown;
  abort: (reason: string) => void;
}

function createChatHandler(params: ChatParams) {
  const streamHandler = AiApi.chat({
    modelName: params.model,
    messages: [SYSTEM_PROMPT, ...params.messages],
    deepThinking: params.deepThinking,
  });

  const task = ChatTaskQuery.getTask(params.conversationId);

  async function runAssistantStream() {
    try {
      task.reset('');
      let isThinking = false;
      const stream = await streamHandler.create();
      for await (const message of stream) {
        if (message.thinking) {
          if (!isThinking) {
            isThinking = true;
            task.append('```think\n');
          }
          task.append(message.thinking);
          continue;
        }
        if (isThinking) {
          task.append('\n```\n');
          isThinking = false;
        }
        task.append(message.content);
      }

      task.finish();
    } catch (error) {
      task.fail('网络出错啦！！！');
    }
  }

  return {
    start: (callback: (event: ChatEvent) => void) => {
      runAssistantStream();
      return task.addListener(callback);
    },
    abort: (reason: string) => {
      streamHandler.abort(reason);
      task.fail(reason);
    },
  };
}

interface SendParams {
  model: AiApi.ChatModelName;
  deepThinking: boolean;
  message: AiApi.ChatMessage;
}

export function useAiChatManager() {
  const controller = useZChatController();

  const [conversationId, setConversationId] = React.useState('');

  const histories = useChatHistoryStore((state) => state.histories);

  useMount(async () => {
    await useChatHistoryStore.getState().fetchHistories();
  });

  const [loading, setLoading] = React.useState(false);
  const [model, setModel] = React.useState<AiApi.ChatModelName>();
  const [deepThinking, setDeepThinking] = React.useState(false);

  const chatHandler = React.useRef<ChatHandler>(null);
  const unsubscriberRef = React.useRef<() => void>(null);

  async function send(message: Message) {
    if (unsubscriberRef.current) {
      unsubscriberRef.current();
      unsubscriberRef.current = null;
    }

    setLoading(true);

    controller.add(message);

    let currentId = conversationId;
    if (!currentId) {
      currentId = await useChatHistoryStore.getState().addHistory({
        title: message.content.substring(0, 20),
        model: model!,
        deepThinking,
        messages: [message],
      });
      setConversationId(currentId);
    }

    chatHandler.current = createChatHandler({
      conversationId: currentId,
      model: model!,
      deepThinking,
      messages: controller.json().map(({ role, content }) => ({
        role,
        content,
      })),
    });

    const output = controller.add({
      role: 'assistant',
      content: '',
    });

    output.setFinish(false);

    unsubscriberRef.current = chatHandler.current.start((event) => {
      if (event.isFinish) {
        setLoading(false);
        output.setFinish(event.isFinish);
      }
      output.setContent(event.content);
    });
  }

  /**
   * 重新生成上一条助手消息
   * @returns
   */
  function regenerate() {
    const output = controller.pop();
    if (!output || output.role !== 'assistant') {
      return;
    }

    const userInput = controller.pop();
    if (!userInput || userInput.role !== 'user') {
      return;
    }

    send(userInput);
  }

  /**
   * 中断当前会话
   * @returns
   */
  function abort() {
    if (!chatHandler.current) {
      return;
    }
    chatHandler.current.abort('用户主动中断了请求');
    setLoading(false);
  }

  /**
   * 切换会话
   * @param {ChatHistorySummary} summary 下一个会话摘要
   * @returns
   */
  async function selectConversation(summary: ChatHistorySummary) {
    if (unsubscriberRef.current) {
      unsubscriberRef.current();
      unsubscriberRef.current = null;
    }

    await useChatHistoryStore.getState().updateHistory({
      id: conversationId,
      messages: controller.json(),
    });

    setLoading(false);
    setConversationId(summary.id);
    setModel(summary.model);
    setDeepThinking(summary.deepThinking);
    const next = await AiConversationApi.getChatHistory(summary.id);
    if (!next) {
      return;
    }
    controller.set(
      next.messages.map((m) => ({
        ...m,
        id: m.id || crypto.randomUUID(),
      })),
    );

    const output = controller.lastMessage;
    if (!output) {
      return;
    }

    const task = ChatTaskQuery.findTask(summary.id);
    if (!task) {
      output.setFinish(true);
      return;
    }

    unsubscriberRef.current = task.addListener((event) => {
      if (event.isFinish) {
        setLoading(false);
        output.setFinish(event.isFinish);
      }
      output.setContent(event.content);
    });
  }

  function newConversation() {
    if (unsubscriberRef.current) {
      unsubscriberRef.current();
      unsubscriberRef.current = null;
    }

    setLoading(false);
    setConversationId('');
    controller.clear();
  }

  /**
   * 删除会话
   * @param {string} id 会话ID
   * @returns
   */
  async function deleteConversation(id: string) {
    await useChatHistoryStore.getState().deleteHistory(id);
  }

  return {
    controller,
    histories,
    conversationId,
    loading,
    model,
    setModel,
    deepThinking,
    setDeepThinking,
    send,
    regenerate,
    abort,
    selectConversation,
    deleteConversation,
    newConversation,
  };
}
