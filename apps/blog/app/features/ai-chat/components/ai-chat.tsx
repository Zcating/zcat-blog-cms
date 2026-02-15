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
} from '@zcat/ui';
import {
  AtomIcon,
  MessageCircleIcon,
  MessageCirclePlusIcon,
} from 'lucide-react';
import React, { useState } from 'react';

import { AiApi } from '../apis/ai-api';
import { useAiChatManager } from '../hooks/use-ai-chat-manager';
import { useChatHistoryStore } from '../stores/use-chat-history-store';

import { apiKeyPromption } from './api-key-promption';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export interface AiChatRef {
  loadConversation: (id: string) => Promise<void>;
  startNewChat: () => void;
}

export const AiChat = React.forwardRef<AiChatRef, AiChatProps>(
  ({ className, emptyComponent }, ref) => {
    const [conversationId, setConversationId] = useState('');

    const [deepThinking, setDeepThinking] = useState(false);
    const [model, setModel] = useState<AiApi.ChatModelName>();

    const chat = useAiChatManager(conversationId);

    const handleStartNewChat = useMemoizedFn(() => {
      useChatHistoryStore.getState().updateChatHistory(conversationId, {
        deepThinking,
        model,
        messages: chat.controller.json(),
      });
      setConversationId('');
      chat.controller.clear();
    });

    const loadConversation = useMemoizedFn(async (id: string) => {
      if (id === conversationId) {
        return;
      }

      const currentState = useChatHistoryStore.getState();

      // 保存当前对话
      currentState.updateChatHistory(conversationId, {
        deepThinking,
        model,
        messages: chat.controller.json(),
      });

      const current = await currentState.getChatHistory(id);
      if (!current) {
        return;
      }

      chat.changeConversation({
        conversationId: id,
        messages: current.messages,
      });
      setConversationId(id);
      setModel(current.model);
      setDeepThinking(current.deepThinking);
    });

    React.useImperativeHandle(ref, () => ({
      loadConversation,
      startNewChat: handleStartNewChat,
    }));

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
      </>
    );
  },
);

AiChat.displayName = 'AiChat';
