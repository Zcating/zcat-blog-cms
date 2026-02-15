import { ZButton, cn, useMemoizedFn } from '@zcat/ui';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react';
import React from 'react';

import type { ChatHistorySummary } from '../chat-history-types';

export interface AiChatHistoryProps {
  histories: ChatHistorySummary[];
  selectedId: string;
  onSelect: (history: ChatHistorySummary) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function AiChatHistory({
  histories,
  selectedId,
  onSelect,
  onDelete,
  onNewChat,
  className,
}: AiChatHistoryProps) {
  return (
    <div
      className={cn(
        'w-80 shrink-0 flex flex-col border-r bg-muted/10',
        className,
      )}
    >
      <div className="p-4 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <ZButton
          className="w-full justify-start font-normal"
          variant="outline"
          onClick={onNewChat}
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
            onSelect={onSelect}
            onDelete={onDelete}
          />
        ))}
        {histories.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            暂无历史记录
          </div>
        )}
      </div>
    </div>
  );
}

export interface AiChatHistoryItemProps {
  history: ChatHistorySummary;
  isSelected?: boolean;
  onSelect?: (history: ChatHistorySummary) => void;
  onDelete?: (id: string) => void;
}

export function AiChatHistoryItem({
  history,
  isSelected,
  onSelect,
  onDelete,
}: AiChatHistoryItemProps) {
  const handleSelect = useMemoizedFn(() => {
    onSelect?.(history);
  });

  const handleDelete = useMemoizedFn(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();

      onDelete?.(history.id);
    },
  );

  return (
    <div
      onClick={handleSelect}
      className={cn(
        'group flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent text-accent-foreground border-primary/50',
      )}
    >
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{history.title}</p>
        <p className="text-xs text-muted-foreground truncate mt-1">
          {history.preview || '暂无消息'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {format(history.updatedAt, 'yyyy-MM-dd HH:mm', {
            locale: zhCN,
          })}
        </p>
      </div>
      <ZButton
        variant="ghost"
        size="icon-sm"
        onClick={handleDelete}
        className={cn(
          'opacity-0 group-hover:opacity-100 transition-opacity ml-2',
          isSelected && 'opacity-100',
        )}
      >
        <Trash2 className="size-4" />
      </ZButton>
    </div>
  );
}
