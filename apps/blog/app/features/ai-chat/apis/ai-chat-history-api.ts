import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

import type {
  ChatHistory,
  ChatHistorySummary,
  CreateChatHistoryParams,
} from '../chat-history-types';
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

export namespace AiChatHistoryApi {
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
      id: crypto.randomUUID(),
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

  export async function getChatHistory(
    id: string,
  ): Promise<ChatHistory | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
  }

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

  export async function deleteChatHistory(id: string): Promise<boolean> {
    const db = await getDB();
    const deleted = await db.delete(STORE_NAME, id);
    return deleted === undefined;
  }

  export async function getAllChatHistoryIds(): Promise<string[]> {
    const db = await getDB();
    return db.getAllKeys(STORE_NAME);
  }

  export async function clearAllChatHistory(): Promise<void> {
    const db = await getDB();
    await db.clear(STORE_NAME);
  }

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
