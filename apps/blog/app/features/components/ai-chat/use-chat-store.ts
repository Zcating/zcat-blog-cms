import { create } from 'zustand';

import { AiApi } from './ai-api';

const SYSTEM_PROMPT = {
  role: 'system',
  content:
    '你是一个专业的 Markdown 助手，能够根据用户的输入生成符合 Markdown 语法的内容。',
} as const;

interface ChatEvent {
  content: string;
  isFinish: boolean;
}

export interface ChatTaskSlice {
  subscribe: (callback: (event: ChatEvent) => void) => Teardown;
  start: () => void;
  abort: (reason: string) => void;
}

class ChatTask {
  private listeners: ((event: ChatEvent) => void)[] = [];
  private state: ChatEvent = {
    content: '',
    isFinish: false,
  };
  private currentStreamHandler?: AiApi.ChatStreamHandler;

  constructor() {
    this.subscribe = this.subscribe.bind(this);
    this.append = this.append.bind(this);
    this.reset = this.reset.bind(this);
    this.finish = this.finish.bind(this);
    this.fail = this.fail.bind(this);
    this.startTask = this.startTask.bind(this);
  }

  subscribe(callback: (event: ChatEvent) => void): Teardown {
    this.listeners.push(callback);
    callback(this.state);

    return () => {
      const index = this.listeners.indexOf(callback);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  startTask(streamHandler: AiApi.ChatStreamHandler): ChatTaskSlice {
    this.currentStreamHandler = streamHandler;

    this.runStream(streamHandler);

    return {
      subscribe: this.subscribe,
      start: () => {
        streamHandler.abort('用户重新发起了请求');
        this.runStream(streamHandler);
      },
      abort: (reason: string) => {
        streamHandler.abort(reason);
        this.fail(reason);
      },
    };
  }

  recover(): ChatTaskSlice | null {
    const streamHandler = this.currentStreamHandler;
    if (!streamHandler) {
      return null;
    }

    return {
      subscribe: this.subscribe,
      start: () => {
        streamHandler.abort('用户重新发起了请求');
        this.runStream(streamHandler);
      },
      abort: (reason: string) => {
        streamHandler.abort(reason);
        this.fail(reason);
      },
    };
  }

  private async runStream(handler: AiApi.ChatStreamHandler) {
    try {
      this.reset('');
      let isThinking = false;
      const stream = await handler.create();
      for await (const message of stream) {
        if (message.thinking) {
          if (!isThinking) {
            isThinking = true;
            this.append('```think\n');
          }
          this.append(message.thinking);
          continue;
        }
        if (isThinking) {
          this.append('\n```\n');
          isThinking = false;
        }
        this.append(message.content);
      }

      this.finish();
    } catch (error) {
      this.fail('网络出错啦！！！');
    }
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

interface ConversationState {}

interface ConversationAction {
  chat: (params: ChatParams) => Promise<ChatTaskSlice>;
  recover: (id: string) => ChatTaskSlice | null;
  saveState: () => string;
}

type ConversationStore = ConversationState & ConversationAction;

export const useChatStore = create<ConversationStore>((set, get) => {
  const conversationTasks = new Map<string, ChatTask>();

  async function chat(params: ChatParams) {
    let task = conversationTasks.get(params.conversationId)!;
    if (!task) {
      task = new ChatTask();
      conversationTasks.set(params.conversationId, task);
    }

    const streamHandler = AiApi.chat(
      params.model,
      [SYSTEM_PROMPT, ...params.messages],
      params.deepThinking,
    );

    return task.startTask(streamHandler);
  }

  function recover(id: string) {
    const task = conversationTasks.get(id);
    if (!task) {
      return null;
    }
    return task.recover();
  }

  function saveState() {
    // const state = get();
    // conversationTasks.set(state.id, state.task);
    // return state.id;
    return '';
  }

  return {
    chat,
    recover,
    saveState,
  };
});
