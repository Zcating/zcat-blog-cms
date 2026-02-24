import { ZButton, cn, useMemoizedFn } from '@zcat/ui';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { ChatTaskQuery } from '../utils';

import type { ChatHistorySummary } from '../apis';

export interface AiChatHistoryProps {
  histories: ChatHistorySummary[];
  conversationId: string;
  loading?: boolean;
  onSelect: (history: ChatHistorySummary) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
  className?: string;
}

export function AiChatHistory({
  histories,
  conversationId,
  loading,
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
            isSelected={conversationId === history.id}
            // 传入 loading 作为触发检查的信号，但不直接决定状态
            checkTrigger={loading}
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
  checkTrigger?: boolean;
  onSelect?: (history: ChatHistorySummary) => void;
  onDelete?: (id: string) => void;
}

export function AiChatHistoryItem({
  history,
  isSelected,
  checkTrigger,
  onSelect,
  onDelete,
}: AiChatHistoryItemProps) {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const task = ChatTaskQuery.findTask(history.id);
    if (!task) {
      // 使用微任务避免同步 setState，防止级联渲染
      queueMicrotask(() => setIsRunning(false));
      return;
    }

    const unsubscribe = task.addListener((event) => {
      setIsRunning(!event.isFinish);
    });

    return () => {
      unsubscribe();
    };
  }, [history.id, checkTrigger]);

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
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{history.title}</p>
          {isRunning && (
            <Loader2 className="size-3.5 text-primary animate-spin shrink-0" />
          )}
        </div>
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
