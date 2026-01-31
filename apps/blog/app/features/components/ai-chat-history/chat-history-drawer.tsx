import { ZButton, ZView } from '@zcat/ui';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@zcat/ui/shadcn/ui/drawer';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import React, { useCallback } from 'react';

import { useChatHistory } from './use-chat-history';

import type { ChatHistorySummary } from './chat-history-types';

export interface ChatHistoryDrawerProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectHistory?: (history: ChatHistorySummary) => void;
  trigger?: React.ReactNode;
}

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  onSelectHistory,
  trigger,
}: ChatHistoryDrawerProps) {
  const { histories, loading, loadMore, refresh, deleteHistory } =
    useChatHistory();

  const handleSelect = useCallback(
    (history: ChatHistorySummary) => {
      onSelectHistory?.(history);
      onOpenChange?.(false);
    },
    [onSelectHistory, onOpenChange],
  );

  const handleDelete = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.stopPropagation();
      await deleteHistory(id);
    },
    [deleteHistory],
  );

  const handleRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      {trigger && <DrawerTrigger asChild>{trigger}</DrawerTrigger>}
      <DrawerContent className="flex flex-col gap-4">
        <DrawerHeader>
          <DrawerTitle>对话历史</DrawerTitle>
          <DrawerDescription>查看和管理您的历史对话</DrawerDescription>
        </DrawerHeader>
        <ZView className="px-4 max-h-[60vh] overflow-y-auto">
          {histories.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p className="text-sm">暂无历史对话</p>
            </div>
          ) : (
            <div className="space-y-2">
              {histories.map((history) => (
                <div
                  key={history.id}
                  onClick={() => handleSelect(history)}
                  className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {history.title}
                    </p>
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
                    onClick={(e) => handleDelete(e, history.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  >
                    <Trash2 className="size-4" />
                  </ZButton>
                </div>
              ))}
              {loading && (
                <div className="flex justify-center py-4">
                  <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}
        </ZView>
        <DrawerClose className="w-full px-4">
          <ZButton variant="outline" className="w-full">
            关闭
          </ZButton>
        </DrawerClose>
      </DrawerContent>
    </Drawer>
  );
}
