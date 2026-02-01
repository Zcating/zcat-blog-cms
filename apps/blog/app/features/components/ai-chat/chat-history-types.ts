import type { AiApi } from './ai-api';
import type { Message } from '@zcat/ui';

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  model: AiApi.ChatModelName;
  deepThinking: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ChatHistorySummary {
  id: string;
  title: string;
  preview: string;
  deepThinking: boolean;
  model: AiApi.ChatModelName;
  createdAt: number;
  updatedAt: number;
}

export interface CreateChatHistoryParams {
  title: string;
  deepThinking: boolean;
  model: AiApi.ChatModelName;
  messages: Message[];
}
