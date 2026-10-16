import { createFileRoute } from '@tanstack/react-router';

import { JsonViewerPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/json-viewer')({
  head: () => ({
    meta: [
      { title: 'JSON 结构化工具' },
      {
        name: 'description',
        content: '在线 JSON 解析与结构化查看工具',
      },
    ],
  }),
  component: JsonViewerPage,
});
