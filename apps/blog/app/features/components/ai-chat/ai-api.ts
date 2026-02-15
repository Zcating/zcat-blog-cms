import { Stream } from '../../utils/stream/stream';

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

  export interface ChatStreamHandler {
    create(deepThinking?: boolean): Promise<Stream<ChatMessage>>;
    abort(reason?: string): void;
  }

  export type ChatModelName = 'deepseek';
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
              model: deepThinking ? 'deepseek-reasoner' : 'deepseek-chat',
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

  export const API_MODELS: CommonOption<ChatModelName>[] = [
    { value: 'deepseek', label: '深度求索' },
  ];

  export function registerModel() {}

  /**
   * 与 AI 模型进行聊天
   */
  export function chat(
    modelName: ChatModelName,
    messages: ChatMessage[],
    deepThinking: boolean,
  ): ChatStreamHandler {
    return createHandler((controller) => {
      const apiKey = getApiKey(modelName);
      if (!apiKey) {
        throw new Error(`Model ${modelName} API key not found`);
      }
      return models[modelName].run(apiKey, messages, deepThinking, controller);
    });
  }

  export async function test(modelName: ChatModelName, apiKey?: string) {
    return await models[modelName].test(apiKey);
  }

  /**
   * 检查指定UI模型的API密钥是否存在
   */
  export async function checkApiKey(model: ChatModelName): Promise<string> {
    const storageKey = getApiKeyStorageKey(model);
    const apiKey = localStorage.getItem(storageKey);
    if (!apiKey) {
      return '';
    }

    const isSuccess = await AiApi.test(model, apiKey);
    if (!isSuccess) {
      return '';
    }

    return apiKey;
  }

  /**
   * 获取指定UI模型的API密钥
   */
  export function getApiKey(model: ChatModelName): string {
    const storageKey = getApiKeyStorageKey(model);
    return localStorage.getItem(storageKey) ?? '';
  }

  /**
   * 保存API密钥
   */
  export function saveApiKey(model: ChatModelName, apiKey: string): void {
    const storageKey = getApiKeyStorageKey(model);

    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API密钥不能为空');
    }

    localStorage.setItem(storageKey, apiKey.trim());
  }

  /**
   * 删除API密钥
   */
  export function deleteApiKey(model: ChatModelName): void {
    const storageKey = getApiKeyStorageKey(model);
    localStorage.removeItem(storageKey);
  }
}

function createHandler(
  fn: (controller: AbortController) => Promise<Stream<AiApi.ChatMessage>>,
): AiApi.ChatStreamHandler {
  let controller: AbortController | null;
  return {
    create() {
      if (!controller) {
        controller = new AbortController();
      }
      return fn(controller);
    },
    abort(reason?: string) {
      if (controller) {
        controller.abort(reason);
        controller = null;
      }
    },
  };
}

/**
 * 获取API密钥存储键名
 */
function getApiKeyStorageKey(model: AiApi.ChatModelName): string {
  return `model-${model}-api-key`;
}
