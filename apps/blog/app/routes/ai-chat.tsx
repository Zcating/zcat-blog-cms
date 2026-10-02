import { ZView } from '@zcat/ui';
import { createFileRoute } from '@tanstack/react-router';

import { AiChat } from '@blog/features';
import { LayoutHeader } from '@blog/features/layouts/components';
import { MENU_OPTIONS } from '@blog/features/layouts/stores';

export const Route = createFileRoute('/ai-chat')({
  head: () => ({
    meta: [
      { title: 'AI 助手' },
      {
        name: 'description',
        content: '基于大语言模型的 AI 智能助手，为您提供实时的问答与交互体验。',
      },
    ],
  }),
  component: AiChatPage,
});

function AiChatPage() {
  return (
    <ZView className="h-full w-full">
      <LayoutHeader options={MENU_OPTIONS} />
      <ZView className="h-content-height relative bg-background">
        <ZView className="flex h-full w-full overflow-hidden bg-background">
          <AiChat className="h-full w-full" />
        </ZView>
      </ZView>
    </ZView>
  );
}
