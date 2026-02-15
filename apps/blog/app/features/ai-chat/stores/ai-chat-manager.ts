import { AiApi } from '../apis/ai-api';

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
    console.log('chat addListener', this.state);

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

class AiChatManager {
  conversationTasks = new Map<string, ChatTask>();

  async recover(conversationId: string) {
    const task = this.conversationTasks.get(conversationId)!;
    if (task) {
      task.reset('');
    }
  }

  async send(params: ChatParams) {
    const streamHandler = AiApi.chat(
      params.model,
      [SYSTEM_PROMPT, ...params.messages],
      params.deepThinking,
    );

    let task = this.conversationTasks.get(params.conversationId)!;
    if (!task) {
      task = new ChatTask();
      this.conversationTasks.set(params.conversationId, task);
    }

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

    runAssistantStream();

    return {
      start: () => {
        streamHandler.abort('用户重新发起了请求');
        runAssistantStream();
      },
      abort: (reason: string) => {
        streamHandler.abort(reason);
        task.fail(reason);
      },
    };
  }
}
