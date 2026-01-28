import { Stream } from '@blog/features/utils/stream/stream';

export namespace AiApiMock {
  export interface ChatMessage {
    role: 'system' | 'user' | 'assistant' | 'function';
    content: string;
  }

  export interface ChatStreamHandler<P> {
    create(params: P): Promise<Stream<ChatMessage>>;
    abort(reason?: string): void;
  }

  export type ChatMessagesHandler = ChatStreamHandler<ChatMessage[]>;

  export function chat(): ChatStreamHandler<ChatMessage[]> {
    return createHandler(async (params: ChatMessage[], controller) => {
      const stream = createTestStreamResponse(
        `收到了${params[params.length - 1].content}，你好！我是 AI 助手，有什么可以帮你的吗？\n${mermaidTestContent}`,
      );

      return Stream.from(stream, controller);
    });
  }

  export function chatWithModel(): ChatStreamHandler<{
    model: string;
    messages: ChatMessage[];
  }> {
    return createHandler(async (params, controller) => {
      const stream = createTestStreamResponse(
        `模型：${params.model}\n收到了${params.messages[params.messages.length - 1].content}，你好！我是 AI 助手，有什么可以帮你的吗？\n${mermaidTestContent}`,
      );
      return Stream.from(stream, controller);
    });
  }

  function createHandler<P>(
    fn: (
      params: P,
      controller: AbortController,
    ) => Promise<Stream<ChatMessage>>,
  ): ChatStreamHandler<P> {
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

  /**
   * 创建一个测试用的流响应，用于模拟 AI 模型的聊天流
   * @param text 要模拟的文本内容
   * @returns 一个可读流，包含模拟的聊天消息
   */
  function createTestStreamResponse(text: string) {
    const encoder = new TextEncoder();

    function* streamGenerator() {
      for (let i = 0; i < text.length; i++) {
        yield encoder.encode(JSON.stringify({ content: text[i] }) + '\n');
      }
      // yield encoder.encode(JSON.stringify({ content: text }) + '\n');
    }

    const iterator = streamGenerator();

    let interval: ReturnType<typeof setInterval>;
    return new ReadableStream({
      async start(controller) {
        interval = setInterval(() => {
          const { value, done } = iterator.next();
          if (done) {
            clearInterval(interval);
            controller.close();
            return;
          }
          controller.enqueue(value);
        }, 20);
      },
      cancel() {
        clearInterval(interval);
      },
    });
  }

  const markdownContent = `# Markdown 标题

这是一个段落。支持 **加粗**、*斜体* 和 ~~删除线~~。

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题

## 列表

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

## 代码块

\`\`\`typescript 
import path from "path";
const greeting = "Hello, World! Hello, World! Hello, World! Hello, World! Hello, World!";
console.log(greeting);
\`\`\`

## 引用

> 这是一个引用块。
> 可以包含多行。

## 表格

| 标题 1 | 标题 2 |
| ------ | ------ |
| 内容 1 | 内容 2 |
| 内容 3 | 内容 4 |

## 数学公式 (KaTeX)

行内公式：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$



## 链接

[ZCat UI](https://github.com/zcat-ui)
`;
}

const mermaidTestContent = `
\`\`\`mermaid
graph TD
    A[开始] --> B{输入数据};
    B --> C{数据有效?};
    C -->|是| D[处理数据];
    C -->|否| E[显示错误];
    D --> F[结束];
    E --> B;
\`\`\`
`;
