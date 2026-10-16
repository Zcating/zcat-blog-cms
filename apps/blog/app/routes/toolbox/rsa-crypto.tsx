import { createFileRoute } from '@tanstack/react-router';

import { RsaCryptoPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/rsa-crypto')({
  head: () => ({
    meta: [
      { title: 'RSA 加解密' },
      {
        name: 'description',
        content: '在线生成 RSA 密钥对，进行公钥加密和私钥解密',
      },
    ],
  }),
  component: RsaCryptoPage,
});
