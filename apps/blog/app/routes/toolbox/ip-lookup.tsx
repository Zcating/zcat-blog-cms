import { createFileRoute } from '@tanstack/react-router';

import { IpLookupPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/ip-lookup')({
  head: () => ({
    meta: [
      { title: 'IP 查询' },
      {
        name: 'description',
        content: '查询当前网络 IP 地址及归属地信息',
      },
    ],
  }),
  component: IpLookupPage,
});
