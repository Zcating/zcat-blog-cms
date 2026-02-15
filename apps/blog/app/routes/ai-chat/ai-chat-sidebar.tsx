import { useMemoizedFn } from '@zcat/ui';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@zcat/ui/shadcn/ui/sidebar';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { MessageCirclePlusIcon, Trash2 } from 'lucide-react';
import React from 'react';

import { useChatHistoryStore } from '@blog/features';

interface AiChatSidebarProps extends React.ComponentProps<typeof Sidebar> {
  selectedId?: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export function AiChatSidebar({
  selectedId,
  onSelect,
  onNewChat,
  ...props
}: AiChatSidebarProps) {
  const { histories, deleteChatHistory } = useChatHistoryStore();

  const handleDelete = useMemoizedFn(
    async (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
      e.stopPropagation();
      await deleteChatHistory(id);
    },
  );

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              onClick={onNewChat}
              className="justify-center border border-dashed text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <MessageCirclePlusIcon className="size-4" />
              <span>新对话</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {histories.map((history) => (
                <SidebarMenuItem key={history.id}>
                  <SidebarMenuButton
                    isActive={history.id === selectedId}
                    onClick={() => onSelect(history.id)}
                    className="h-auto flex-col items-start gap-1 py-3"
                  >
                    <div className="flex w-full items-center justify-between gap-2">
                      <span className="font-medium truncate text-sm">
                        {history.title}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {format(history.updatedAt, 'MM-dd HH:mm', {
                          locale: zhCN,
                        })}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground line-clamp-2 w-full text-left">
                      {history.preview || '暂无消息'}
                    </span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    showOnHover
                    onClick={(e) => handleDelete(e, history.id)}
                  >
                    <Trash2 />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
