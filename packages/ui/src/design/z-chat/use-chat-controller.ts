import React from 'react';

import { MessageImpl } from './message';

import type { Message } from './message';

export class ZChatController {
  private _messages: MessageImpl[];
  private _listeners: Set<(messages: MessageImpl[]) => void>;

  constructor(initialMessages: Message[] = []) {
    this._messages = initialMessages.map(MessageImpl.from);
    this._listeners = new Set<(messages: MessageImpl[]) => void>();
  }

  private _notify() {
    const copy = [...this._messages];
    this._listeners.forEach((fn) => fn(copy));
  }

  get json() {
    return this._messages.map((msg) => msg.json);
  }

  get messages() {
    return this._messages;
  }

  subscribe(listener: (messages: MessageImpl[]) => void) {
    this._listeners.add(listener);
    return () => {
      this._listeners.delete(listener);
    };
  }

  add(message: Message | MessageImpl): MessageImpl {
    const msg = MessageImpl.from(message);
    this._messages.push(msg);
    this._notify();
    return msg;
  }

  pop() {
    const msg = this._messages.pop();
    if (msg) {
      this._notify();
    }
  }

  clear() {
    this._messages = [];
    this._notify();
  }
}

export function useZChatController(initialMessages: Message[] = []) {
  const [array] = React.useState(() => new ZChatController(initialMessages));
  return array;
}
