import { isObject } from '@zcat/ui';

import { Stream } from '../../../apis/utils/stream';

export namespace AiApi {
  interface ChatCompletion {
    choices: {
      delta: {
        content: string;
        reasoning_content?: string;
      };
    }[];
  }
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
    thinking?: string;
  }

  export interface ChatStreamHandler<P> {
    create(params: P, deepThinking?: boolean): Promise<Stream<ChatMessage>>;
    abort(reason?: string): void;
  }

  export type ChatMessagesHandler = ChatStreamHandler<ChatMessage[]>;

  type ChatModelName = 'deepseek';
  type ChatModels = {
    [x in ChatModelName]: {
      run(
        apiKey: string,
        params: ChatMessage[],
        deepThinking: boolean,
        controller: AbortController,
      ): Promise<Stream<ChatMessage>>;
      test(token?: string): Promise<boolean>;
    };
  };

  const models: ChatModels = {
    deepseek: {
      run: async (
        apiKey: string,
        params: ChatMessage[],
        deepThinking: boolean,
        controller: AbortController,
      ) => {
        if (!apiKey) {
          throw new Error(`Model deepseek API key not found`);
        }
        const response = await fetch(
          'https://api.deepseek.com/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: deepThinking ? 'deepseek-chat' : 'deepseek-reasoner',
              messages: params,
              stream: true,
              tools: [],
              tool_choice: 'auto',
            }),
            signal: controller.signal,
          },
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
          thinking: chunk?.choices[0].delta.reasoning_content || '',
          content: chunk?.choices[0].delta.content || '',
        }));
      },
      async test(token?: string) {
        if (!token) {
          return false;
        }
        const response = await fetch('https://api.deepseek.com/models', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
        const result = (await response.json()) as { error?: string };
        return !result.error;
      },
    },
  };

  export function registerModel() {}

  /**
   * 与 AI 模型进行聊天
   */
  export function chat(
    modelName: ChatModelName,
    apiKey: string,
  ): ChatMessagesHandler {
    return createHandler(
      (params: ChatMessage[], deepThinking: boolean, controller) => {
        return models[modelName].run(apiKey, params, deepThinking, controller);
      },
    );
  }

  export async function test(modelName: ChatModelName, apiKey?: string) {
    return await models[modelName].test(apiKey);
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
