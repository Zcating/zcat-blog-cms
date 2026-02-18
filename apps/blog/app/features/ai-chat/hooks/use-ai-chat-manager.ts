import { useMount, useZChatController, type Message } from '@zcat/ui';
import React from 'react';

import { AiApi } from '../apis/ai-api';
import {
  AiConversationApi,
  type ChatHistorySummary,
} from '../apis/ai-conversation-api';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
} as const;

interface ChatEvent {
  content: string;
  isFinish: boolean;
}

class ChatTask {
  private listeners: ((event: ChatEvent) => void)[] = [];
  private state: ChatEvent = {
    content: '',
    isFinish: false,
  };

  constructor() {
    this.addListener = this.addListener.bind(this);
    this.append = this.append.bind(this);
    this.reset = this.reset.bind(this);
    this.finish = this.finish.bind(this);
    this.fail = this.fail.bind(this);
  }

  addListener(callback: (event: ChatEvent) => void): Teardown {
    this.listeners.push(callback);
    callback(this.state);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  append(content: string) {
    this.state.content += content;
    this.listeners.forEach((listener) => listener(this.state));
  }

  reset(content: string) {
    this.state.isFinish = false;
    this.state.content = content;
    this.listeners.forEach((listener) => listener(this.state));
  }

  finish() {
    this.state.isFinish = true;
    this.listeners.forEach((listener) => listener(this.state));
  }

  fail(content: string) {
    this.state.isFinish = true;
    this.state.content = content;
    this.listeners.forEach((listener) => listener(this.state));
  }
}

interface ChatParams {
  conversationId: string;
  model: AiApi.ChatModelName;
  deepThinking: boolean;
  messages: AiApi.ChatMessage[];
}

const conversationTasks = new Map<string, ChatTask>();

function getTask(conversationId: string) {
  let task = conversationTasks.get(conversationId);
  if (!task) {
    task = new ChatTask();
    conversationTasks.set(conversationId, task);
  }
  return task;
}

interface ChatHandler {
  start: () => void;
  restart: () => void;
  abort: (reason: string) => void;
  subscribe: (callback: (event: ChatEvent) => void) => Teardown;
}

function createChatHandler(params: ChatParams) {
  const streamHandler = AiApi.chat({
    modelName: params.model,
    messages: [SYSTEM_PROMPT, ...params.messages],
    deepThinking: params.deepThinking,
  });

  const task = getTask(params.conversationId);

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
    start: () => {
      runAssistantStream();
    },
    restart: () => {
      streamHandler.abort('用户重新发起了请求');
      runAssistantStream();
    },
    abort: (reason: string) => {
      streamHandler.abort(reason);
      task.fail(reason);
    },
    subscribe: (callback: (event: ChatEvent) => void) => {
      return task.addListener(callback);
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

  const [conversationId, setConversationId] = React.useState(() => {
    return AiConversationApi.createConversationId();
  });

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

    unsubscriberRef.current = chatHandler.current.subscribe((event) => {
      if (event.isFinish) {
        setLoading(false);
      }
      output.content = event.content;
    });

    chatHandler.current.start();
  }

  function regenerate() {
    if (!chatHandler.current) {
      return;
    }
    chatHandler.current.restart();
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
    console.log(next);
    if (!next) {
      return;
    }
    controller.set(next.messages);
  }

  function newConversation() {
    if (unsubscriberRef.current) {
      unsubscriberRef.current();
      unsubscriberRef.current = null;
    }

    setLoading(false);
    const conversationId = AiConversationApi.createConversationId();
    setConversationId(conversationId);
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
