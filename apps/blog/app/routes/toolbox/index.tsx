import { createFileRoute } from '@tanstack/react-router';

import { ToolboxHomePage } from '@blog/features';

export const Route = createFileRoute('/toolbox/')({
  head: () => ({
    meta: [
      { title: '工具箱' },
      {
        name: 'description',
        content: '常用功能入口',
      },
    ],
  }),
  component: ToolboxHomePage,
});
