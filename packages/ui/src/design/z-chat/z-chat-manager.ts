import React from 'react';
import useConstant from 'use-constant';

interface ZChatMessageParams {
  // id: string;
  content: string;
  role: 'user' | 'assistant';
  time?: string;
}

export class ZChatMessage {
  // id: string;
  content: string;
  role: 'user' | 'assistant';
  time?: string;

  private listeners: ((content: string) => void)[] = [];

  constructor(params: ZChatMessageParams) {
    // this.id = params.id;
    this.content = params.content;
    this.role = params.role;
    this.time = params.time;
  }

  setContent(content: string) {
    this.content = content;
    this.listeners.forEach((listener) => listener(content));
  }

  addListener(listener: (content: string) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index === -1) {
        return;
      }
      this.listeners.splice(index, 1);
    };
  }
}

export class ZChatManager {
  private messages: ZChatMessage[] = [];

  private listeners: ((messages: ZChatMessage[]) => void)[] = [];

  get length() {
    return this.messages.length;
  }

  add(message: ZChatMessageParams) {
    const messageInstance = new ZChatMessage(message);
    this.messages.push(messageInstance);
    this.listeners.forEach((listener) => listener(this.messages));
    return messageInstance;
  }

  remove(message: ZChatMessage) {
    this.messages = this.messages.filter((m) => m !== message);
  }

  map<T>(callback: (message: ZChatMessage, index: number) => T): T[] {
    return this.messages.map(callback);
  }

  addListener(listener: (messages: ZChatMessage[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index === -1) {
        return;
      }
      this.listeners.splice(index, 1);
    };
  }
}

export function useZChatManager() {
  const charArray = useConstant(() => new ZChatManager());
  return charArray;
}
