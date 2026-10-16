import { createFileRoute } from '@tanstack/react-router';

import { AesCryptoPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/aes-crypto')({
  head: () => ({
    meta: [
      { title: 'AES 加解密' },
      { name: 'description', content: '在线 AES 加密、解密工具' },
    ],
  }),
  component: AesCryptoPage,
});
