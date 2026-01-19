import { ZChat, type Message } from '@zcat/ui';
import dayjs from 'dayjs';
import { useState } from 'react';

import { ApiTable } from '../../features/docs';

import type { MetaFunction } from 'react-router';

const markdownContent = `# Markdown 标题

这是一个段落。支持 **加粗**、*斜体* 和 ~~删除线~~。

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题

## Lorem ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## 列表

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

## 代码块

\`\`\`typescript 
import path from "path";
const greeting = "Hello, World!";
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

const chatApiData = [
  {
    attribute: 'messages',
    type: 'Message[]',
    default: '[]',
    description: '消息列表，content 支持 string 或 ReadableStream',
  },
  {
    attribute: 'onSendMessage',
    type: '(message: string) => void',
    default: '-',
    description: '发送消息时的回调函数',
  },
  {
    attribute: 'loading',
    type: 'boolean',
    default: 'false',
    description: '是否处于等待回复状态（显示加载动画，禁用输入）',
  },
  {
    attribute: 'placeholder',
    type: 'string',
    default: "'Type a message...'",
    description: '输入框占位符',
  },
  {
    attribute: 'className',
    type: 'string',
    default: '-',
    description: '自定义样式类名',
  },
];

const createStreamResponse = (text: string) => {
  const encoder = new TextEncoder();

  function* streamGenerator() {
    for (let i = 0; i < text.length; i++) {
      yield encoder.encode(text[i]);
    }
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
      }, 30);
    },
    cancel() {
      clearInterval(interval);
    },
  });
};

export const meta: MetaFunction = () => {
  return [
    { title: 'Chat - @zcat/ui' },
    { name: 'description', content: 'Chat component documentation' },
  ];
};

export default function ZChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        '你好！我是 AI 助手，有什么可以帮你的吗？（输入 "stream" 可测试流式响应）',
      time: dayjs().format('hh:mm'),
    },
  ]);
  const [loading, setLoading] = useState(false);

  // 使用 Generator 模拟流式生成

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      time: dayjs().format('hh:mm'),
    };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    if (content.toLowerCase().includes('stream')) {
      const stream = createStreamResponse(markdownContent);
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: stream,
        time: dayjs().format('hh:mm'),
      };
      // 模拟一点延迟再开始返回
      setTimeout(() => {
        setMessages((prev) => [...prev, responseMessage]);
        setLoading(false);
      }, 500);
      return;
    }

    // Simulate AI response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到你的消息：“${content}”。这是一个模拟回复。`,
        time: dayjs().format('mm:ss'),
      };
      setMessages((prev) => [...prev, responseMessage]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chat 聊天</h1>
        <p className="text-muted-foreground">用于构建 AI 对话界面的组件。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">示例</h2>
        <div className="border rounded-xl p-6 bg-muted/10">
          <ZChat
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            className="h-[500px]"
          />
        </div>
      </div>

      <ApiTable data={chatApiData} />
    </div>
  );
}
