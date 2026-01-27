import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Waterfall - @zcat/ui' },
    { name: 'description', content: 'Waterfall component documentation' },
  ];
}

const exampleContent = `
# Waterfall 瀑布流

用于展示多列布局的组件，支持不等高元素。

## Basic Usage

\`\`\`typescript-demo
import { ZWaterfall } from '@zcat/ui';

const mockData = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  height: Math.floor(Math.random() * 200) + 100,
  color: ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200'][i % 4],
}));

export function DemoComponent() {
  return (
    <div className="border rounded-lg p-4">
      <ZWaterfall
        data={mockData}
        columns={3}
        renderItem={(item) => (
          <div
            className={\`w-full rounded-lg flex items-center justify-center \${item.color} text-slate-700 font-medium\`}
            style={{ height: item.height }}
          >
            Item {item.id}
          </div>
        )}
      />
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| data | T[] | - | 数据源数组 |
| columns | number | - | 列数 |
| columnGap | 'sm' \\| 'md' \\| 'lg' \\| 'xl' \\| '2xl' \\| '3xl' \\| '4xl' | - | 列间距 |
| rowGap | 'sm' \\| 'md' \\| 'lg' \\| 'xl' \\| '2xl' \\| '3xl' \\| '4xl' | - | 行间距 |
| renderItem | (item: T, index: number) => React.ReactNode | - | 自定义渲染函数 |
| className | string | - | 自定义类名 |
`;

export default function WaterfallPage() {
  return (
    <ZMarkdown
      className="pb-40"
      content={exampleContent}
      customCodeComponents={useConstant(() => ({
        'typescript-demo': ExecutableCodeBlock,
      }))}
    />
  );
}
