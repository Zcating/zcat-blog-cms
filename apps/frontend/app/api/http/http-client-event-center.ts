export namespace HttpClientEventCenter {
  type EventNames = 'UNAUTH' | 'ERROR';

  const eventListeners: Record<EventNames, (() => void)[]> = {
    UNAUTH: [],
    ERROR: [],
  };

  export function emitEvent(eventName: EventNames) {
    eventListeners[eventName].forEach((listener) => listener());
  }

  export function subscribe(eventName: EventNames, callback: () => void) {
    eventListeners[eventName].push(callback);
    return () => {
      const index = eventListeners[eventName].indexOf(callback);
      if (index !== -1) {
        eventListeners[eventName].splice(index, 1);
      }
    };
  }
}
