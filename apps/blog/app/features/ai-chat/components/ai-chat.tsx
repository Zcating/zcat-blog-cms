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
import React, { useState } from 'react';

import { AiApi } from '../apis/ai-api';
import { useAiChatManager } from '../hooks/use-ai-chat-manager';

import { apiKeyPromption } from './api-key-promption';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export const AiChat = ({ className, emptyComponent }: AiChatProps) => {
  const [conversationId, setConversationId] = useState('');

  const [deepThinking, setDeepThinking] = useState(false);
  const [model, setModel] = useState<AiApi.ChatModelName>();

  const chat = useAiChatManager();

  /**
   * 发送消息
   */
  const handleSend = useMemoizedFn(async (message: Message) => {
    const result = await apiKeyPromption(model);
    if (!result) {
      return false;
    }

    return chat.send({
      conversationId: conversationId,
      model: result.model,
      deepThinking,
      message: message,
    });
  });

  return (
    <ZChat
      className={cn('overflow-hidden', className)}
      controller={chat.controller}
      onSend={handleSend}
      onAbort={() => chat.abort()}
      onRegenerate={chat.regenerate}
      placeholder="问问AI..."
      emptyComponent={emptyComponent}
      toolbar={
        <ZView className="flex items-center gap-1 h-full">
          <ZView className="flex items-center gap-1">
            <ZSelect
              size="sm"
              placeholder="选择模型"
              options={AiApi.API_MODELS}
              value={model}
              onValueChange={setModel}
            />
            <Toggle
              variant="outline"
              size="sm"
              pressed={deepThinking}
              onPressedChange={setDeepThinking}
              aria-label="开启深度思考模式，AI将提供更详细全面的分析"
            >
              <AtomIcon className="size-4" />
              <p>深度思考</p>
            </Toggle>
          </ZView>
        </ZView>
      }
    />
  );
};

AiChat.displayName = 'AiChat';
