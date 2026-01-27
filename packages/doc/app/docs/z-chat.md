# Chat 聊天

用于构建 AI 对话界面的组件。

## Basic Usage

```typescript-demo
import { ZChat, ZChatController, type Message } from '@zcat/ui';

export function DemoComponent() {
  const controller = new ZChatController([]);

  const handleSend = async (message: Message) => {
    console.log('发送消息:', message);
    controller.add(message);
    controller.add({ role: 'assistant', content: '你好！我是 AI 助手，有什么可以帮你的吗？' });
  };

  return (
    <ZChat
      controller={controller}
      onSend={handleSend}
      onAbort={() => {}}
      className="h-[300px]"
    />
  );
}
```

## Preset Messages

```typescript-demo
import { ZChat, ZChatController, type Message } from '@zcat/ui';

const initialMessages: Message[] = [
  { role: 'assistant', content: '你好！有什么我可以帮你的吗？' },
  { role: 'user', content: '请介绍一下 React 的 Hooks。' },
  { role: 'assistant', content: 'React Hooks 是 React 16.8 引入的新特性，常用的包括：\n- useState: 管理状态\n- useEffect: 处理副作用' },
];

export function DemoComponent() {
  const controller = new ZChatController(initialMessages);

  const handleSend = async (message: Message) => {
    controller.add(message);
  };

  return (
    <ZChat
      controller={controller}
      onSend={handleSend}
      onAbort={() => {}}
      className="h-[300px]"
    />
  );
}
```

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| controller | ZChatController | - | 消息控制器，用于管理消息状态 |
| onSend | (message: Message) => void \| Promise<void> | - | 发送消息时的回调函数 |
| onRegenerate? | () => void \| Promise<void> | - | 重新生成回复时的回调函数 |
| onAbort? | () => void | - | 停止响应时的回调函数 |
| placeholder | string | 'Type a message...' | 输入框占位符 |
| toolbar? | React.ReactNode | - | 自定义工具栏内容 |
| emptyComponent? | React.ReactNode \| React.ComponentType | - | 空状态时显示的组件 |
| className | string | - | 自定义样式类名 |

## Message 类型

```typescript
interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  isFinish?: boolean;
}
```
