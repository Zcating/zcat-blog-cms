import React from 'react';

import type { Message, MessageImpl } from './message';

export function useChatMessage<T extends keyof Message>(
  message: MessageImpl,
  prop: T,
) {
  const [value, setValue] = React.useState<Message[T]>(message[prop]);
  React.useEffect(() => {
    const unsubscribe = message.subscribe<T>((innerProp, value) => {
      if (innerProp !== prop) {
        return;
      }
      setValue(value);
    });
    return unsubscribe;
  }, [message, prop]);

  return value;
}
