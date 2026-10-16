import { createFileRoute } from '@tanstack/react-router';

import { AboutPage } from '@blog/features';
import { getUserInfo } from '@blog/server/user';

export const Route = createFileRoute('/_blog/about')({
  head: () => ({
    meta: [{ title: '关于' }, { name: 'description', content: '个人技术博客' }],
  }),
  loader: async () => {
    const userInfo = await getUserInfo();
    return {
      userInfo: userInfo,
    };
  },
  component: AboutPage,
});
