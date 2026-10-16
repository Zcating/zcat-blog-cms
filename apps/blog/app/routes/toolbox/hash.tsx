import { createFileRoute } from '@tanstack/react-router';

import { HashPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/hash')({
  head: () => ({
    meta: [
      { title: 'Hash 计算工具' },
      {
        name: 'description',
        content: '在线计算文本的 MD5, SHA-1, SHA-256, SHA-512 哈希值',
      },
    ],
  }),
  component: HashPage,
});
