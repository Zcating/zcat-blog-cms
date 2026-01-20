import type { Message } from './z-chat';

type Listener = () => void;

type Entry = {
  target: Message;
  proxy: Message;
  listeners: Set<Listener>;
};

const entryByObject = new WeakMap<object, Entry>();

function getEntry(message: Message) {
  return entryByObject.get(message as unknown as object);
}

export function observeMessage(message: Message): Message {
  const existingEntry = getEntry(message);
  if (existingEntry) {
    return existingEntry.proxy;
  }

  const listeners = new Set<Listener>();
  const entry: Entry = {
    target: message,
    proxy: message,
    listeners,
  };

  const proxy = new Proxy(message as unknown as object, {
    set(target, prop, value, receiver) {
      const prev = Reflect.get(target, prop, receiver);
      const ok = Reflect.set(target, prop, value, receiver);
      if (!ok) {
        return false;
      }
      if (prev !== value) {
        entry.listeners.forEach((fn) => fn());
      }
      return true;
    },
  }) as unknown as Message;

  entry.proxy = proxy;
  entryByObject.set(message as unknown as object, entry);
  entryByObject.set(proxy as unknown as object, entry);

  return proxy;
}

export function subscribeMessage(message: Message, listener: Listener) {
  const proxy = observeMessage(message);
  const entry = getEntry(proxy);
  if (!entry) {
    return () => {};
  }
  entry.listeners.add(listener);
  return () => {
    entry.listeners.delete(listener);
  };
}
