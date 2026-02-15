import { ZButton, ZView } from '@zcat/ui';
import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  AiChat,
  AiChatHistoryItem,
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
      <div className="w-80 shrink-0 flex flex-col border-r bg-muted/10">
        <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
          <ZButton
            className="w-full justify-start font-normal"
            variant="outline"
            onClick={handleNewChat}
          >
            <Plus className="mr-2 h-4 w-4" />
            新对话
          </ZButton>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {histories.map((history) => (
            <AiChatHistoryItem
              key={history.id}
              history={history}
              isSelected={selectedId === history.id}
              onSelect={handleSelect}
              onDelete={handleDelete}
            />
          ))}
          {histories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground text-sm">
              暂无历史记录
            </div>
          )}
        </div>
      </div>

      {/* 聊天主区域 */}
      <ZView className="flex flex-col flex-1 min-w-0">
        <ZView className="flex-1 overflow-hidden relative">
          <AiChat ref={aiChatRef} className="h-full w-full" />
        </ZView>
      </ZView>
    </ZView>
  );
}
