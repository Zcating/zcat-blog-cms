import { ZWaterfall } from '@zcat/ui';

import { ApiTable } from '~/features';

// Mock data
const mockData = Array.from({ length: 20 }).map((_, i) => ({
  id: i,
  height: Math.floor(Math.random() * 200) + 100,
  color: ['bg-red-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200'][i % 4],
}));

export function meta() {
  return [
    { title: 'Waterfall - @zcat/ui' },
    { name: 'description', content: 'Waterfall component documentation' },
  ];
}

const apiData = [
  {
    attribute: 'data',
    type: 'T[]',
    default: '-',
    description: '数据源数组',
  },
  {
    attribute: 'columns',
    type: 'number',
    default: '-',
    description: '列数',
  },
  {
    attribute: 'columnGap',
    type: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'",
    default: '-',
    description: '列间距',
  },
  {
    attribute: 'rowGap',
    type: "'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl'",
    default: '-',
    description: '行间距',
  },
  {
    attribute: 'renderItem',
    type: '(item: T, index: number) => React.ReactNode',
    default: '-',
    description: '自定义渲染函数',
  },
  {
    attribute: 'className',
    type: 'string',
    default: '-',
    description: '自定义类名',
  },
];

export default function WaterfallPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Waterfall 瀑布流</h1>
        <p className="text-muted-foreground">
          用于展示多列布局的组件，支持不等高元素。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="border rounded-lg p-4">
          <ZWaterfall
            data={mockData}
            columns={3}
            renderItem={(item) => (
              <div
                className={`w-full rounded-lg flex items-center justify-center ${item.color} text-slate-700 font-medium`}
                style={{ height: item.height }}
              >
                Item {item.id}
              </div>
            )}
          />
        </div>
      </div>

      <ApiTable data={apiData} />
    </div>
  );
}
