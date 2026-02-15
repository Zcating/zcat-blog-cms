import { ZView } from '@zcat/ui';
import { useEffect, useRef, useState } from 'react';

import {
  AiChat,
  AiChatHistory,
  type AiChatRef,
  type ChatHistorySummary,
  useChatHistoryStore,
} from '@blog/features';

export default function AiChatPage() {
  const aiChatRef = useRef<AiChatRef>(null);
  const [selectedId, setSelectedId] = useState<string>('');
  const { histories, loadChatHistories, deleteChatHistory } =
    useChatHistoryStore();

  useEffect(() => {
    loadChatHistories(true);
  }, [loadChatHistories]);

  const handleSelect = (history: ChatHistorySummary) => {
    if (selectedId === history.id) return;
    setSelectedId(history.id);
    aiChatRef.current?.loadConversation(history.id);
  };

  const handleNewChat = () => {
    setSelectedId('');
    aiChatRef.current?.startNewChat();
  };

  const handleDelete = async (
    e: React.MouseEvent<HTMLButtonElement>,
    id: string,
  ) => {
    e.stopPropagation();
    if (confirm('确认删除该对话吗？')) {
      await deleteChatHistory(id);
      if (selectedId === id) {
        handleNewChat();
      }
    }
  };

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
          <AiChat ref={aiChatRef} className="h-full w-full" />
        </ZView>
      </ZView>
    </ZView>
  );
}
