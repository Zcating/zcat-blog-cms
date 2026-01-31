import type { Message } from '@zcat/ui';

export interface ChatHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatHistorySummary {
  id: string;
  title: string;
  preview: string;
  createdAt: number;
  updatedAt: number;
}

export interface CreateChatHistoryParams {
  messages: Message[];
  title?: string;
}
