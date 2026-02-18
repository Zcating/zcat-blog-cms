import { ZView } from '@zcat/ui';

import { AiChat, AiChatHistory, useAiChatManager } from '@blog/features';

export default function AiChatPage() {
  const manager = useAiChatManager();

  return (
    <ZView className="flex h-full w-full overflow-hidden bg-background">
      {/* 历史对话侧边栏 */}
      <AiChatHistory
        histories={manager.histories}
        conversationId={manager.conversationId}
        onSelect={manager.selectConversation}
        onDelete={manager.deleteConversation}
        onNewChat={manager.newConversation}
      />

      {/* 聊天主区域 */}
      <ZView className="flex flex-col flex-1 min-w-0">
        <ZView className="flex-1 overflow-hidden relative">
          <AiChat
            className="h-full w-full"
            controller={manager.controller}
            onSend={manager.send}
            onRegenerate={manager.regenerate}
            onAbort={manager.abort}
            loading={manager.loading}
          />
        </ZView>
      </ZView>
    </ZView>
  );
}
