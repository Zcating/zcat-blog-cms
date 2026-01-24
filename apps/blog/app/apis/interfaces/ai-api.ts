import { isObject } from '@zcat/ui';

import { Stream } from '../utils/stream';

export namespace AiApi {
  interface ChatCompletion {
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
    create(
      params: P,
      deepThinking?: boolean,
    ): Promise<Stream<AiApi.ChatMessage>>;
    abort(reason?: string): void;
  }

  export type ChatMessagesHandler = ChatStreamHandler<ChatMessage[]>;

  type ChatModelName = 'deepseek';

  const models = {
    deepseek: async (
      params: ChatMessage[],
      deepThinking: boolean,
      controller: AbortController,
    ) => {
      const token = getToken('deepseek');
      if (!token) {
        throw new Error(`Model deepseek API key not found`);
      }
      return await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          model: deepThinking ? 'deepseek-chat' : 'deepseek-reasoner',
          messages: params,
          stream: true,
          tools: [],
          tool_choice: 'auto',
        }),
        signal: controller.signal,
      });
    },
  };

  /**
   * 与 AI 模型进行聊天
   */
  export function chat(modelName: ChatModelName): ChatMessagesHandler {
    return createHandler(
      async (params: ChatMessage[], deepThinking: boolean, controller) => {
        const response = await models[modelName](
          params,
          deepThinking,
          controller,
        );
        const stream = response.body;
        if (!stream) {
          throw new Error('Response body is null');
        }
        return Stream.from<ChatCompletion | null>(
          response.body,
          controller,
        ).map((chunk) => ({
          role: 'assistant',
          content: chunk?.choices[0].delta.content || '',
        }));
      },
    );
  }

  function getToken(modelName: ChatModelName) {
    return localStorage.getItem(`model-${modelName}-api-key`);
  }
}

function createHandler<P>(
  fn: (
    params: P,
    deepThinking: boolean,
    controller: AbortController,
  ) => Promise<Stream<AiApi.ChatMessage>>,
): AiApi.ChatStreamHandler<P> {
  const controller = new AbortController();
  const handler = {
    create(params: P, deepThinking?: boolean) {
      return fn(params, !!deepThinking, controller);
    },
    abort(reason?: string) {
      controller.abort(reason);
    },
  };
  return handler;
}
