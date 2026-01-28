import { cn, ZSelect, ZChat, Toggle } from '@zcat/ui';
import { AtomIcon } from 'lucide-react';
import React from 'react';

import { useLocalStorageState } from '@blog/features/hooks';

import { type ApiModelName, API_MODELS } from './ai-model-utils';
import { useAiChatManager } from './use-ai-chat-manager';

interface AiChatProps {
  className?: string;
  emptyComponent?: React.ReactNode | React.ComponentType;
}

export function AiChat({ className, emptyComponent }: AiChatProps) {
  const [model, setModel] = useLocalStorageState<ApiModelName | undefined>(
    'ai-model',
    undefined,
  );

  const chat = useAiChatManager(model);

  return (
    <ZChat
      className={cn('overflow-hidden', className)}
      controller={chat.controller}
      onSend={chat.send}
      onAbort={() => chat.abort('用户取消')}
      onRegenerate={chat.regenerate}
      placeholder="问问都有什么工具..."
      emptyComponent={emptyComponent}
      toolbar={
        <div className="flex items-center gap-2">
          <ZSelect
            size="sm"
            placeholder="选择模型"
            options={API_MODELS}
            value={model}
            onValueChange={setModel}
          />
          <Toggle
            variant="outline"
            size="sm"
            pressed={chat.deepThinking}
            onPressedChange={chat.toggleDeepThinking}
            aria-label="开启深度思考模式，AI将提供更详细全面的分析"
          >
            <AtomIcon className="size-4" />
            <p>深度思考</p>
          </Toggle>
        </div>
      }
    />
  );
}
