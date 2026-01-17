export namespace EventCenter {
  interface EventListener {
    UNAUTH: (error: Error) => void;
    ERROR: (error: Error) => void;
  }

  type EventNames = keyof EventListener;

  type EventListenerMap = Record<EventNames, EventListener[EventNames][]>;

  type EventListenerParams<T extends EventNames> = Parameters<
    EventListener[T]
  >[0];

  const eventListeners: EventListenerMap = {
    UNAUTH: [],
    ERROR: [],
  };

  export function emitEvent<T extends EventNames>(
    eventName: T,
    event: EventListenerParams<T>,
  ): void;
  export function emitEvent(eventName: EventNames, event?: any) {
    eventListeners[eventName].forEach((listener) => listener(event));
  }

  export function subscribe<T extends EventNames>(
    eventName: T,
    callback: EventListener[T],
  ) {
    eventListeners[eventName].push(callback);
    return () => {
      const index = eventListeners[eventName].indexOf(callback);
      if (index !== -1) {
        eventListeners[eventName].splice(index, 1);
      }
    };
  }
}
