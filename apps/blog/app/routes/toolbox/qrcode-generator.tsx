import { createFileRoute } from '@tanstack/react-router';

import { QrCodeGeneratorPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/qrcode-generator')({
  head: () => ({
    meta: [
      { title: '二维码生成器' },
      {
        name: 'description',
        content: '在线二维码生成工具，支持自定义颜色、大小和纠错等级',
      },
    ],
  }),
  component: QrCodeGeneratorPage,
});
