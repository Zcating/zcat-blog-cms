import { ZView } from '@zcat/ui';

import { AiChat, AiChatHistory, useAiChatManager } from '@blog/features';

export default function AiChatPage() {
  return (
    <ZView className="flex h-full w-full overflow-hidden bg-background">
      <AiChat className="h-full w-full" />
    </ZView>
  );
}
