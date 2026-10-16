import { createFileRoute } from '@tanstack/react-router';

import { Base64ToImagePage } from '@blog/features';

export const Route = createFileRoute('/toolbox/base64-to-image')({
  head: () => ({
    meta: [
      { title: '图片和 Base64 互转' },
      {
        name: 'description',
        content: '将图片转换为 Base64 编码，或将 Base64 编码转换为图片',
      },
    ],
  }),
  component: Base64ToImagePage,
});
