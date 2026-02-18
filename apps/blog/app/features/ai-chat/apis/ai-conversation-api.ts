import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type { AiApi } from './ai-api';
import type { Message } from '@zcat/ui';

interface ChatHistoryDB extends DBSchema {
  chatHistories: {
    key: string;
    value: ChatHistory;
    indexes: { 'by-created': number; 'by-updated': number };
  };
}

const DB_NAME = 'chat-history-db';
const DB_VERSION = 1;
const STORE_NAME = 'chatHistories';

let db: IDBPDatabase<ChatHistoryDB> | null = null;

async function getDB(): Promise<IDBPDatabase<ChatHistoryDB>> {
  if (!db) {
    db = await openDB<ChatHistoryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        });
        store.createIndex('by-created', 'createdAt');
        store.createIndex('by-updated', 'updatedAt');
      },
    });
  }
  return db;
}

/**
 * 聊天历史记录API
 */
export namespace AiConversationApi {
  /**
   * 创建一个新的聊天历史记录ID
   * @returns 新的聊天历史记录ID
   */
  export function createConversationId(): string {
    return `${Date.now()}-${crypto.randomUUID()}`;
  }

  /**
   * 创建一个新的聊天历史记录
   * @param params 创建聊天历史记录的参数
   * @returns 创建的聊天历史记录
   */
  export async function createChatHistory(
    params: CreateChatHistoryParams,
  ): Promise<ChatHistory> {
    const db = await getDB();
    const now = Date.now();
    const messages = params.messages;

    let title: string = '新对话';
    if (!params.title && messages.length > 0) {
      const firstUserMessage = messages.find((m) => m.role === 'user');
      title = firstUserMessage?.content.slice(0, 50) || '新对话';
    } else if (params.title) {
      title = params.title;
    }

    const chatHistory: ChatHistory = {
      id: `${Date.now()}-${crypto.randomUUID()}`,
      title,
      messages,
      model: params.model,
      deepThinking: params.deepThinking || false,
      createdAt: now,
      updatedAt: now,
    };

    await db.put(STORE_NAME, chatHistory);
    return chatHistory;
  }

  /**
   * 获取指定ID的聊天历史记录
   * @param id 聊天历史记录ID
   * @returns 聊天历史记录或undefined
   */
  export async function getChatHistory(
    id: string,
  ): Promise<ChatHistory | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
  }

  /**
   * 获取聊天历史记录摘要列表
   * @param limit 每页数量，默认50
   * @param offset 偏移量，默认0
   * @returns 聊天历史记录摘要列表
   */
  export async function getChatHistorySummaries(
    limit: number = 50,
    offset: number = 0,
  ): Promise<ChatHistorySummary[]> {
    const db = await getDB();
    const all = await db.getAllFromIndex(STORE_NAME, 'by-updated');
    const reversed = all.reverse().slice(offset, offset + limit);

    return reversed.map((chat) => ({
      id: chat.id,
      title: chat.title,
      preview:
        chat.messages.find((m) => m.role === 'user')?.content.slice(0, 100) ||
        '',
      deepThinking: chat.deepThinking,
      model: chat.model,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    }));
  }

  /**
   * 更新指定ID的聊天历史记录
   * @param id 聊天历史记录ID
   * @param updates 要更新的聊天历史记录字段
   * @returns 更新后的聊天历史记录或undefined
   */
  export async function updateChatHistory(
    id: string,
    updates: Partial<ChatHistory>,
  ): Promise<ChatHistory | undefined> {
    const db = await getDB();
    const existing = await db.get(STORE_NAME, id);
    if (!existing) return undefined;

    const updated: ChatHistory = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
    };

    await db.put(STORE_NAME, updated);
    return updated;
  }

  /**
   * 删除指定ID的聊天历史记录
   * @param id 聊天历史记录ID
   * @returns 是否成功删除
   */
  export async function deleteChatHistory(id: string): Promise<boolean> {
    const db = await getDB();
    const deleted = await db.delete(STORE_NAME, id);
    return deleted === undefined;
  }

  /**
   * 获取所有聊天历史记录ID
   * @returns 所有聊天历史记录ID列表
   */
  export async function getAllChatHistoryIds(): Promise<string[]> {
    const db = await getDB();
    return db.getAllKeys(STORE_NAME);
  }

  /**
   * 清空所有聊天历史记录
   */
  export async function clearAllChatHistory(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }

  /**
   * 生成聊天标题
   * @param messages 聊天消息列表
   * @returns 生成的聊天标题
   */
  export async function generateChatTitle(
    messages: Message[],
  ): Promise<string> {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (!firstUserMessage) return '新对话';

    const content = firstUserMessage.content;
    if (content.length <= 30) return content;

    return content.slice(0, 30) + '...';
  }
}

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
