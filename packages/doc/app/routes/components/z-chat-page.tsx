import { ZChat, type Message } from '@zcat/ui';
import { useState } from 'react';

import type { MetaFunction } from 'react-router';

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
      content: '你好！我是 AI 助手，有什么可以帮你的吗？',
      time: '12:00',
    },
  ]);
  const [loading, setLoading] = useState(false);

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    setMessages((prev) => [...prev, newMessage]);
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `收到你的消息：“${content}”。这是一个模拟回复。`,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
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

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">属性</th>
                <th className="h-10 px-4 text-left font-medium">类型</th>
                <th className="h-10 px-4 text-left font-medium">默认值</th>
                <th className="h-10 px-4 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-mono">messages</td>
                <td className="p-4 font-mono text-muted-foreground">
                  Message[]
                </td>
                <td className="p-4 font-mono text-muted-foreground">[]</td>
                <td className="p-4">消息列表，包含 id, role, content, time</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onSendMessage</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string) ={'>'} void
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">发送消息时的回调函数</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">loading</td>
                <td className="p-4 font-mono text-muted-foreground">boolean</td>
                <td className="p-4 font-mono text-muted-foreground">false</td>
                <td className="p-4">
                  是否处于等待回复状态（显示加载动画，禁用输入）
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">placeholder</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;Type a message...&apos;
                </td>
                <td className="p-4">输入框占位符</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义样式类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
