import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@zcat/ui/shadcn/ui/sidebar';
import { useRef, useState } from 'react';

import { AiChat, type AiChatRef } from '@blog/features';

import { AiChatSidebar } from './ai-chat-sidebar';

export default function AiChatPage() {
  const aiChatRef = useRef<AiChatRef>(null);
  const [selectedId, setSelectedId] = useState<string>('');

  const handleSelect = (id: string) => {
    setSelectedId(id);
    aiChatRef.current?.loadConversation(id);
  };

  const handleNewChat = () => {
    setSelectedId('');
    aiChatRef.current?.startNewChat();
  };

  return (
    <SidebarProvider>
      <AiChatSidebar
        selectedId={selectedId}
        onSelect={handleSelect}
        onNewChat={handleNewChat}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="h-4 w-px bg-border mx-2" />
          <span className="font-medium">AI 助手</span>
        </header>
        <div className="flex-1 overflow-hidden h-[calc(100vh-4rem)]">
          <AiChat ref={aiChatRef} className="h-full" />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
