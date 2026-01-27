import React from 'react';

import { isFunction } from '@zcat/ui/utils';

import { ZChatProps } from './z-chat';

export function useZChatSender(
  onSend: ZChatProps['onSend'],
  onAbort?: ZChatProps['onAbort'],
  onRegenerate?: ZChatProps['onRegenerate'],
) {
  const [loading, setLoading] = React.useState(false);
  const handleSend = async (content: string) => {
    setLoading(true);
    try {
      const result = onSend({ role: 'user', content });
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAbort = () => {
    setLoading(false);
    if (!isFunction(onAbort)) {
      return;
    }
    onAbort();
  };

  const handleRegenerate = async () => {
    setLoading(true);
    try {
      if (!isFunction(onRegenerate)) {
        return;
      }
      const result = onRegenerate?.();
      if (result instanceof Promise) {
        await result;
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    handleSend,
    handleAbort,
    handleRegenerate,
    loading,
  };
}
