export interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  isFinish?: boolean;
}

type MessageListener = (
  prop: keyof Message,
  value: Message[keyof Message],
) => void;

export class MessageImpl implements Message {
  id?: string;
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  isFinish?: boolean;
  private _listeners: Set<MessageListener> = new Set();

  static from(message: Message | MessageImpl): MessageImpl {
    return message instanceof MessageImpl ? message : new MessageImpl(message);
  }

  constructor(message: Message) {
    this.id = message.id;
    this.role = message.role;
    this.content = message.content;
    this.isFinish = message.isFinish;
  }

  get json(): Message {
    return {
      id: this.id,
      role: this.role,
      content: this.content,
      isFinish: this.isFinish,
    };
  }

  reset() {
    this.content = '';
    this._listeners.forEach((fn) => fn('content', this.content));

    this.isFinish = false;
    this._listeners.forEach((fn) => fn('isFinish', this.isFinish));
  }

  setContent(content: string) {
    this.content = content;
    this._listeners.forEach((fn) => fn('content', this.content));
  }

  appendContent(content: string) {
    this.content += content;
    this._listeners.forEach((fn) => fn('content', this.content));
  }

  setFinish(finish: boolean = true) {
    this.isFinish = finish;
    this._listeners.forEach((fn) => fn('isFinish', finish));
  }

  subscribe<T extends keyof Message>(
    listener: (prop: T, value: Message[T]) => void,
  ) {
    this._listeners.add(listener as MessageListener);
    return () => {
      this._listeners.delete(listener as MessageListener);
    };
  }
}
