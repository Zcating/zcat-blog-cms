import React from 'react';

import { useMount } from '@zcat/ui/hooks';

import { MessageImpl } from './message';
import { ZChatController } from './use-chat-controller';

export function useChatMessages(controller: ZChatController) {
  const [values, setValues] = React.useState<MessageImpl[]>([]);

  useMount(() => {
    return controller.subscribe((messages) => {
      setValues(messages);
    });
  });

  return values;
}
