import { ZButton, cn, useMemoizedFn } from '@zcat/ui';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import React from 'react';

import type { ChatHistorySummary } from './chat-history-types';

export interface ChatHistoryItemProps {
  history: ChatHistorySummary;
  isSelected?: boolean;
  onSelect?: (history: ChatHistorySummary) => void;
  onDelete?: (e: React.MouseEvent<HTMLButtonElement>, id: string) => void;
}

export function ChatHistoryItem({
  history,
  isSelected,
  onSelect,
  onDelete,
}: ChatHistoryItemProps) {
  const handleSelect = useMemoizedFn(() => {
    onSelect?.(history);
  });

  const handleDelete = useMemoizedFn(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      onDelete?.(e, history.id);
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
