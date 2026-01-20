import { createObservableMessage, ZChat, type Message } from '@zcat/ui';
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

function BasicChatDemo() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        '你好！我是 AI 助手，有什么可以帮你的吗？（输入 "stream" 可测试流式响应）',
    },
  ]);

  const handleSendMessage = async (message: Message) => {
    setMessages((prev) => [...prev, message]);

    if (message.content.toLowerCase().includes('stream')) {
      // 模拟一点延迟再开始返回
      await new Promise((resolve) => setTimeout(resolve, 500));

      const responseMessage: Message = createObservableMessage({
        role: 'assistant',
        content: '',
      });
      setMessages((prev) => [...prev, responseMessage]);

      const stream = createStreamResponse(markdownContent);
      while (true) {
        const { value, done } = await stream.getReader().read();
        if (done) {
          break;
        }
        responseMessage.content += value;
      }
      return;
    }

    // Simulate AI response
    setTimeout(() => {
      const responseMessage: Message = {
        role: 'assistant',
        content: `收到你的消息：“${message.content}”。这是一个模拟回复。`,
      };
      setMessages((prev) => [...prev, responseMessage]);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-medium tracking-tight">基础示例</h3>
        <p className="text-sm text-muted-foreground">
          支持 Markdown 渲染和流式响应。
        </p>
      </div>
      <div className="border rounded-xl p-6 bg-muted/10">
        <ZChat
          messages={messages}
          onSend={handleSendMessage}
          onAbort={() => {}}
          className="h-[500px]"
        />
      </div>
    </div>
  );
}

function PresetChatDemo() {
  const messages: Message[] = [
    {
      role: 'assistant',
      content: '你好！有什么我可以帮你的吗？',
    },
    {
      role: 'user',
      content: '请介绍一下 React 的 Hooks。',
    },
    {
      role: 'assistant',
      content: `React Hooks 是 React 16.8 引入的新特性，允许你在不编写 class 的情况下使用 state 和其他 React 特性。
      
常用的 Hooks 包括：
- \`useState\`: 管理状态
- \`useEffect\`: 处理副作用
- \`useContext\`: 共享上下文
- \`useReducer\`: 复杂状态管理`,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-medium tracking-tight">预设对话</h3>
        <p className="text-sm text-muted-foreground">
          展示一段已经完成的对话历史。
        </p>
      </div>
      <div className="border rounded-xl p-6 bg-muted/10">
        <ZChat
          messages={messages}
          onSend={() => {}}
          onAbort={() => {}}
          className="h-[400px]"
        />
      </div>
    </div>
  );
}

function CustomStyleDemo() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSendMessage = (newMessage: Message) => {
    setMessages((prev) => [...prev, newMessage]);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '收到！',
        },
      ]);
    }, 500);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h3 className="text-xl font-medium tracking-tight">自定义样式</h3>
        <p className="text-sm text-muted-foreground">
          自定义高度、边框和 Placeholder。
        </p>
      </div>
      <div className="border rounded-xl p-6 bg-muted/10">
        <ZChat
          messages={messages}
          onSend={handleSendMessage}
          onAbort={() => {}}
          placeholder="请输入您的问题（自定义 Placeholder）..."
          className="h-[300px] border-primary/20 bg-background/50"
        />
      </div>
    </div>
  );
}

export default function ZChatPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Chat 聊天</h1>
        <p className="text-muted-foreground">用于构建 AI 对话界面的组件。</p>
      </div>

      <div className="space-y-12">
        <BasicChatDemo />
        <PresetChatDemo />
        <CustomStyleDemo />
      </div>

      <ApiTable data={chatApiData} />
    </div>
  );
}
