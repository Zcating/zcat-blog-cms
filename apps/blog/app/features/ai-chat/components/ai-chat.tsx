import {
  cn,
  ZSelect,
  ZChat,
  Toggle,
  ZView,
  type Message,
  useMemoizedFn,
} from '@zcat/ui';
import { AtomIcon } from 'lucide-react';
import React from 'react';

import { AiApi } from '../apis/ai-api';
import { useAiChatManager } from '../hooks/use-ai-chat-manager';

import { AiChatHistory } from './ai-chat-history';
import { apiKeyPromption } from './api-key-promption';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode;
}

export const AiChat = ({ className, emptyComponent }: AiChatProps) => {
  const manager = useAiChatManager();

  /**
   * 发送消息
   */
  const handleSend = useMemoizedFn(async (message: Message) => {
    const result = await apiKeyPromption(manager.model);
    if (!result) {
      return;
    }

    manager.send(message);
  });

  return (
    <ZView className="flex h-full w-full overflow-hidden bg-background">
      {/* 历史对话侧边栏 */}
      <AiChatHistory
        histories={manager.histories}
        conversationId={manager.conversationId}
        loading={manager.loading}
        onSelect={manager.selectConversation}
        onDelete={manager.deleteConversation}
        onNewChat={manager.newConversation}
      />

      {/* 聊天主区域 */}
      <ZView className="flex flex-col flex-1 min-w-0">
        <ZView className="flex-1 overflow-hidden relative">
          <ZChat
            className={cn('overflow-hidden', className)}
            controller={manager.controller}
            loading={manager.loading}
            onSend={handleSend}
            onAbort={manager.abort}
            onRegenerate={manager.regenerate}
            placeholder="问问AI..."
            emptyComponent={emptyComponent}
            toolbar={
              <ZView className="flex items-center gap-1 h-full">
                <ZView className="flex items-center gap-1">
                  <ZSelect
                    size="sm"
                    placeholder="选择模型"
                    options={AiApi.API_MODELS}
                    value={manager.model}
                    onValueChange={manager.setModel}
                  />
                  <Toggle
                    variant="outline"
                    size="sm"
                    pressed={manager.deepThinking}
                    onPressedChange={manager.setDeepThinking}
                    aria-label="开启深度思考模式，AI将提供更详细全面的分析"
                  >
                    <AtomIcon className="size-4" />
                    <p>深度思考</p>
                  </Toggle>
                </ZView>
              </ZView>
            }
          />
        </ZView>
      </ZView>
    </ZView>
  );
};

AiChat.displayName = 'AiChat';
