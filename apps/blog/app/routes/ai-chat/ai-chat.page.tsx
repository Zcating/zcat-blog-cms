import { ZView } from '@zcat/ui';
import React from 'react';

import { AiChat, AiChatHistory, type ChatHistorySummary } from '@blog/features';

export default function AiChatPage() {
  const [selectedId, setSelectedId] = React.useState<string>('');

  const histories: ChatHistorySummary[] = [];

  const handleSelect = (history: ChatHistorySummary) => {};

  const handleNewChat = () => {};

  const handleDelete = async (id: string) => {};

  return (
    <ZView className="flex h-full w-full overflow-hidden bg-background">
      {/* 历史对话侧边栏 */}
      <AiChatHistory
        histories={histories}
        selectedId={selectedId}
        onSelect={handleSelect}
        onDelete={handleDelete}
        onNewChat={handleNewChat}
      />

      {/* 聊天主区域 */}
      <ZView className="flex flex-col flex-1 min-w-0">
        <ZView className="flex-1 overflow-hidden relative">
          <AiChat className="h-full w-full" />
        </ZView>
      </ZView>
    </ZView>
  );
}
