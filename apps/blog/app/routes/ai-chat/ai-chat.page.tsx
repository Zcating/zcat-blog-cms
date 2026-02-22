import { ZView } from '@zcat/ui';

import { AiChat, AiChatHistory, useAiChatManager } from '@blog/features';

export function meta() {
  return [
    { title: 'AI 助手' },
    {
      name: 'description',
      content: '基于大语言模型的 AI 智能助手，为您提供实时的问答与交互体验。',
    },
  ];
}

export default function AiChatPage() {
  return (
    <ZView className="flex h-full w-full overflow-hidden bg-background">
      <AiChat className="h-full w-full" />
    </ZView>
  );
}
