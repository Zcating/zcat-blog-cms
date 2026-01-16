import { ZWaterfall } from '@zcat/ui';

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

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">属性</th>
                <th className="h-10 px-4 text-left font-medium">类型</th>
                <th className="h-10 px-4 text-left font-medium">默认值</th>
                <th className="h-10 px-4 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-mono">data</td>
                <td className="p-4 font-mono text-muted-foreground">T[]</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">数据源数组</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">columns</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">列数</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">columnGap</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; |
                  &apos;xl&apos; | &apos;2xl&apos; | &apos;3xl&apos; |
                  &apos;4xl&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">列间距</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">rowGap</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; |
                  &apos;xl&apos; | &apos;2xl&apos; | &apos;3xl&apos; |
                  &apos;4xl&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">行间距</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">renderItem</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (item: T, index: number) ={'>'} React.ReactNode
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义渲染函数</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
