import { useMemoizedFn, ZButton, ZDrawer, ZView } from '@zcat/ui';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { Trash2 } from 'lucide-react';
import React from 'react';

import type { ChatHistorySummary } from './chat-history-types';

export interface ChatHistoryContentProps {
  data: ChatHistorySummary[];
  onClose?: () => void;
  onSelect?: (history: ChatHistorySummary) => void;
  onDelete?: (id: string) => Promise<boolean>;
}

export function ChatHistoryContent({
  data,
  onClose,
  onSelect,
  onDelete,
}: ChatHistoryContentProps) {
  const handleSelect = useMemoizedFn((history: ChatHistorySummary) => {
    onSelect?.(history);
    onClose?.();
  });

  const handleDelete = useMemoizedFn(
    async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.stopPropagation();
      onDelete?.(id);
    },
  );

  return (
    <ZView className="max-h-[60vh] overflow-y-auto">
      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <p className="text-sm">暂无历史对话</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((history) => (
            <div
              key={history.id}
              onClick={() => handleSelect(history)}
              className="group flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
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
                onClick={(e) => handleDelete(e, history.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
              >
                <Trash2 className="size-4" />
              </ZButton>
            </div>
          ))}
        </div>
      )}
    </ZView>
  );
}

interface ShowChatHistoryDrawerProps {
  data: ChatHistorySummary[];
  onSelect: (history: ChatHistorySummary) => void;
  onDelete: (id: string) => Promise<boolean>;
}

/**
 * 显示对话历史抽屉
 * @param props 抽屉属性
 */
export function showChatHistoryDrawer(props: ShowChatHistoryDrawerProps) {
  ZDrawer.show({
    title: '对话历史',
    description: '查看和管理您的历史对话',
    direction: 'right',
    content: ({ onClose }) => (
      <ChatHistoryContent
        data={props.data}
        onClose={onClose}
        onSelect={props.onSelect}
        onDelete={props.onDelete}
      />
    ),
    footer: ({ onClose }) => (
      <ZButton variant="outline" className="w-full" onClick={onClose}>
        关闭
      </ZButton>
    ),
  });
}
