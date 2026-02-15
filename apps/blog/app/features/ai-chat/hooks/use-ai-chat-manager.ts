import { type Message, useMemoizedFn, useZChatController } from '@zcat/ui';
import React from 'react';

import { AiApi } from '../apis/ai-api';
import { useChatStore, type ChatTaskSlice } from '../stores/use-chat-store';

function createMessageId() {
  return `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

interface AiChatForm {
  conversationId: string;
  model: AiApi.ChatModelName;
  deepThinking: boolean;
  message: Message;
}

interface ConversationChangeParams {
  conversationId: string;
  messages: Message[];
}

export function useAiChatManager(id: string) {
  const controller = useZChatController();

  const chatActionRef = React.useRef<ChatTaskSlice | null>(null);

  const unsubscriptionRef = React.useRef<Teardown | null>(null);

  /**
   * 发送用户消息并处理 AI 助手的响应
   * @param message 用户发送的消息
   * @returns 是否成功发送消息
   */
  const send = useMemoizedFn(async (form: AiChatForm) => {
    if (unsubscriptionRef.current) {
      unsubscriptionRef.current();
      unsubscriptionRef.current = null;
    }

    controller.add({
      ...form.message,
      id: createMessageId(),
    });

    try {
      chatActionRef.current = await useChatStore.getState().chat({
        conversationId: form.conversationId,
        model: form.model,
        deepThinking: form.deepThinking,
        messages: controller.json(),
      });

      const last = controller.add({
        role: 'assistant',
        content: '',
        id: createMessageId(),
      });

      unsubscriptionRef.current = chatActionRef.current.subscribe((event) => {
        last.setContent(event.content);
        last.setFinish(event.isFinish);
      });
    } catch (error) {
      console.error('创建聊天处理程序失败:', error);
      return false;
    }

    return true;
  });

  /**
   * 重新生成当前 AI 助手的响应
   */
  const regenerate = useMemoizedFn(async () => {
    if (!chatActionRef.current) {
      return;
    }
    chatActionRef.current?.start();
  });

  /**
   * 取消当前正在进行的聊天操作
   * @param reason 取消操作的原因
   */
  const abort = useMemoizedFn(async (reason: string) => {
    const chatAction = chatActionRef.current;
    if (!chatAction) {
      return;
    }

    chatAction.abort(reason);
  });

  /**
   * 切换当前聊天会话
   * @param params 包含新会话 ID 和消息数组的参数
   * @returns 是否成功切换会话
   */
  function changeConversation(params: ConversationChangeParams) {
    if (unsubscriptionRef.current) {
      unsubscriptionRef.current();
      unsubscriptionRef.current = null;
    }

    controller.set(params.messages);

    const chatTask = useChatStore.getState().recover(id);
    if (!chatTask) {
      return;
    }
    chatActionRef.current = chatTask;

    const last = controller.lastMessage;
    if (!last || last.role !== 'assistant') {
      return;
    }

    unsubscriptionRef.current = chatTask.subscribe((event) => {
      last.setContent(event.content);
      last.setFinish(event.isFinish);
    });
  }

  return {
    controller,
    send,
    abort,
    regenerate,
    changeConversation,
  };
}
