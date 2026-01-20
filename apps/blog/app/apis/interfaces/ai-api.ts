import { isObject } from '@zcat/ui';

import { Stream } from '../utils/stream';

export namespace AiApi {
  interface OpenAIChatCompletion {
    choices: {
      delta: {
        content: string;
      };
    }[];
  }
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
  }

  export interface ChatStreamHandler<P> {
    create(params: P): Promise<Stream<AiApi.ChatMessage>>;
    abort(reason?: string): void;
  }

  export type ChatMessagesHandler = ChatStreamHandler<ChatMessage[]>;

  /**
   * 与 AI 模型进行聊天
   */
  export function chat(): ChatMessagesHandler {
    return createHandler(async (params: ChatMessage[], controller) => {
      const response = await fetch(
        'https://api.deepseek.com/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + process.env.DEEPSEEK_API_KEY,
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: params,
            stream: true,
          }),
          signal: controller.signal,
        },
      );
      const stream = response.body;
      if (!stream) {
        throw new Error('Response body is null');
      }
      return Stream.from<OpenAIChatCompletion>(response.body, controller).map(
        (chunk) => ({
          role: 'assistant',
          content: chunk.choices[0].delta.content,
        }),
      );
    });
  }
}

function createHandler<P>(
  fn: (
    params: P,
    controller: AbortController,
  ) => Promise<Stream<AiApi.ChatMessage>>,
): AiApi.ChatStreamHandler<P> {
  const controller = new AbortController();
  const handler = {
    create(params: P) {
      return fn(params, controller);
    },
    abort(reason?: string) {
      controller.abort(reason);
    },
  };
  return handler;
}
