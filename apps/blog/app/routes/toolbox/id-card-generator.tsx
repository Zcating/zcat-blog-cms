import { createFileRoute } from '@tanstack/react-router';

import { IdCardGeneratorPage } from '@blog/features';

export const Route = createFileRoute('/toolbox/id-card-generator')({
  head: () => ({
    meta: [
      { title: '身份证生成' },
      {
        name: 'description',
        content:
          '根据地区码、生日与性别生成合法的18位身份证号（含校验位）。示例地区码非完整库，仅供学习与测试使用。',
      },
    ],
  }),
  component: IdCardGeneratorPage,
});
