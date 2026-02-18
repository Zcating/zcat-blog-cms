import { useMount, useZChatController, type Message } from '@zcat/ui';
import React from 'react';

import { AiApi } from '../apis/ai-api';
import {
  AiConversationApi,
  type ChatHistorySummary,
} from '../apis/ai-conversation-api';
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

  const [histories, setHistories] = React.useState<ChatHistorySummary[]>([]);
  useMount(async () => {
    const data = await AiConversationApi.getChatHistorySummaries();
    setHistories(data);
  });

  const [loading, setLoading] = React.useState(false);
  const chatHandler = React.useRef<ChatHandler>(null);
  const unsubscriberRef = React.useRef<() => void>(null);

  async function send(params: SendParams) {
    setLoading(true);

    let currentId = conversationId;
    if (!currentId) {
      currentId = AiConversationApi.createConversationId();
      const history = await AiConversationApi.createChatHistory({
        title: params.message.content.slice(0, 100),
        model: params.model,
        deepThinking: params.deepThinking,
        messages: [params.message],
      });
      setConversationId(history.id);
      setHistories([
        { ...history, preview: params.message.content.slice(0, 100) },
        ...histories,
      ]);
    }

    controller.add(params.message);

    chatHandler.current = createChatHandler({
      conversationId,
      model: params.model,
      deepThinking: params.deepThinking,
      messages: controller.json(),
    });

    const output = controller.add({
      role: 'assistant',
      content: '',
    });

    unsubscriberRef.current = chatHandler.current.start((event) => {
      if (event.isFinish) {
        setLoading(false);
        output.setFinish(event.isFinish);
      }
      output.setContent(event.content);
    });
  }

  function regenerate() {
    setLoading(true);
    controller.pop();
    const userInput = controller.lastMessage;
    if (!userInput || userInput.role !== 'user') {
      return;
    }

    // send({
    //   model: params.model,
    //   deepThinking: params.deepThinking,
    //   message: userInput,
    // });
  }

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

    await AiConversationApi.updateChatHistory(conversationId, {
      messages: controller.json(),
    });

    setLoading(false);
    setConversationId(summary.id);
    const next = await AiConversationApi.getChatHistory(summary.id);
    if (!next) {
      return;
    }
    controller.set(next.messages);

    const output = controller.lastMessage;
    if (!output) {
      return;
    }

    const task = ChatTaskQuery.findTask(summary.id);
    if (!task) {
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

  return {
    controller,
    histories,
    conversationId,
    loading,
    send,
    regenerate,
    abort,
    selectConversation,
    newConversation,
  };
}
