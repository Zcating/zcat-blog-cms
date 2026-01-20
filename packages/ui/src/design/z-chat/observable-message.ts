import type { Message } from './z-chat';

const LISTENERS = Symbol.for('@zcat/ui.z-chat.message.listeners');
const IS_OBSERVABLE = Symbol.for('@zcat/ui.z-chat.message.isObservable');

type Listener = () => void;

type ObservableMessage = Message & {
  [LISTENERS]?: Set<Listener>;
  [IS_OBSERVABLE]?: true;
};

export function observeMessage(message: Message) {
  const target = message as ObservableMessage;
  if (target[IS_OBSERVABLE]) {
    return;
  }

  const listeners = new Set<Listener>();
  target[LISTENERS] = listeners;
  target[IS_OBSERVABLE] = true;

  let content = target.content;
  Object.defineProperty(target, 'content', {
    get() {
      return content;
    },
    set(next) {
      content = next;
      listeners.forEach((fn) => fn());
    },
    enumerable: true,
    configurable: true,
  });

  let isFinish = target.isFinish;
  Object.defineProperty(target, 'isFinish', {
    get() {
      return isFinish;
    },
    set(next) {
      isFinish = next;
      listeners.forEach((fn) => fn());
    },
    enumerable: true,
    configurable: true,
  });
}

export function subscribeMessage(message: Message, listener: Listener) {
  observeMessage(message);
  const target = message as ObservableMessage;
  const listeners = target[LISTENERS];
  if (!listeners) {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
