import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Chat - @zcat/ui' },
    { name: 'description', content: 'Chat component documentation' },
  ];
}

const exampleContent = `
# Chat 聊天

用于构建 AI 对话界面的组件。

## Basic Usage

\`\`\`typescript-demo
import { ZChat, type Message } from '@zcat/ui';
import { useState } from 'react';

const messages: Message[] = [
  { role: 'assistant', content: '你好！我是 AI 助手，有什么可以帮你的吗？' },
];

export function DemoComponent() {
  const handleSend = (message: Message) => {
    console.log('发送消息:', message);
  };

  return (
    <div className="border rounded-xl p-6 bg-muted/10">
      <ZChat
        messages={messages}
        onSend={handleSend}
        onAbort={() => {}}
        className="h-[300px]"
      />
    </div>
  );
}
\`\`\`

## Preset Messages

\`\`\`typescript-demo
import { ZChat, type Message } from '@zcat/ui';

const messages: Message[] = [
  { role: 'assistant', content: '你好！有什么我可以帮你的吗？' },
  { role: 'user', content: '请介绍一下 React 的 Hooks。' },
  { role: 'assistant', content: 'React Hooks 是 React 16.8 引入的新特性，常用的包括：\\n- useState: 管理状态\\n- useEffect: 处理副作用' },
];

export function DemoComponent() {
  return (
    <div className="border rounded-xl p-6 bg-muted/10">
      <ZChat
        messages={messages}
        onSend={() => {}}
        onAbort={() => {}}
        className="h-[300px]"
      />
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| messages | Message[] | [] | 消息列表，content 支持 string 或 ReadableStream |
| onSend | (message: string) => void | - | 发送消息时的回调函数 |
| loading | boolean | false | 是否处于等待回复状态 |
| placeholder | string | 'Type a message...' | 输入框占位符 |
| className | string | - | 自定义样式类名 |
`;

export default function ZChatPage() {
  return (
    <ZMarkdown
      className="pb-40"
      content={exampleContent}
      customCodeComponents={useConstant(() => ({
        'typescript-demo': ExecutableCodeBlock,
      }))}
    />
  );
}
