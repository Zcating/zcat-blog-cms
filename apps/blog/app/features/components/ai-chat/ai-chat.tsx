import {
  cn,
  ZSelect,
  ZChat,
  Toggle,
  ZButton,
  Separator,
  ZView,
  type Message,
  useMemoizedFn,
  ZNotification,
  useMount,
  ZDrawer,
} from '@zcat/ui';
import {
  AtomIcon,
  MessageCircleIcon,
  MessageCirclePlusIcon,
} from 'lucide-react';
import React, { useState } from 'react';

import { AiApi } from './ai-api';
import { apiKeyPromption } from './api-key-promption';
import { ChatHistoryContent } from './chat-history-drawer';
import { useAiChatManager } from './use-ai-chat-manager';
import { useChatHistoryStore } from './use-chat-history-store';

import type { ChatHistorySummary } from './chat-history-types';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const [conversationId, setConversationId] = useState('');

  const [deepThinking, setDeepThinking] = useState(false);
  const [model, setModel] = useState<AiApi.ChatModelName>();

  const chat = useAiChatManager(conversationId);

  const handleSelectHistory = useMemoizedFn(
    async (history: ChatHistorySummary) => {
      useChatHistoryStore.getState().updateChatHistory(conversationId, {
        deepThinking,
        model,
        messages: chat.controller.json(),
      });

      console.log('handleSelectHistory', {
        conversationId,
        deepThinking,
        model,
        messages: chat.controller.json(),
      });

      setConversationId(history.id);
      const current = await useChatHistoryStore
        .getState()
        .getChatHistory(history.id);
      if (!current) {
        return;
      }

      console.log('handleSelectHistory current', {
        conversationId: history.id,
        deepThinking,
        model,
        messages: current.messages,
      });

      chat.changeConversation({
        conversationId: history.id,
        messages: current.messages,
      });
      setModel(current.model);
      setDeepThinking(current.deepThinking);
    },
  );

  const handleStartNewChat = useMemoizedFn(() => {
    useChatHistoryStore.getState().updateChatHistory(conversationId, {
      deepThinking,
      model,
      messages: chat.controller.json(),
    });
    setConversationId('');
    chat.controller.clear();
  });

  const handleOpenHistory = useMemoizedFn(() => {
    ZDrawer.show({
      title: '对话历史',
      description: '查看和管理您的历史对话',
      direction: 'right',
      content: ({ onClose }) => (
        <ChatHistoryContent
          onClose={onClose}
          onSelectHistory={(history) => {
            handleSelectHistory(history);
            onClose();
          }}
        />
      ),
      footer: ({ onClose }) => (
        <ZButton variant="outline" className="w-full" onClick={onClose}>
          关闭
        </ZButton>
      ),
    });
  });

  const handleSend = useMemoizedFn(async (message: Message) => {
    const result = await apiKeyPromption(model);
    if (!result) {
      ZNotification.error('请先配置 API key');
      return false;
    }

    if (!conversationId) {
      const history = await useChatHistoryStore.getState().createChatHistory({
        model: result.model,
        messages: [message],
        title: message.content,
        deepThinking,
      });
      setConversationId(history.id);
    }

    return chat.send({
      conversationId: conversationId,
      model: result.model,
      deepThinking,
      message: message,
    });
  });

  useMount(() => useChatHistoryStore.getState().loadChatHistories());

  return (
    <>
      <ZChat
        className={cn('overflow-hidden', className)}
        controller={chat.controller}
        onSend={handleSend}
        onAbort={() => chat.abort('用户取消')}
        onRegenerate={chat.regenerate}
        placeholder="问问都有什么工具..."
        emptyComponent={emptyComponent}
        toolbar={
          <div className="flex items-center gap-1 h-full">
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
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-1">
              <ZButton
                variant="outline"
                size="sm"
                onClick={handleStartNewChat}
                aria-label="开始新对话"
              >
                <MessageCirclePlusIcon className="size-4" />
                新对话
              </ZButton>
              <ZButton
                variant="outline"
                size="sm"
                onClick={handleOpenHistory}
                aria-label="查看历史对话"
              >
                <MessageCircleIcon className="size-4" />
                历史对话
              </ZButton>
            </div>
          </div>
        }
      />
    </>
  );
}
