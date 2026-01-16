import { ZView } from '@zcat/ui';

import type { Route } from './+types/view-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'View - @zcat/ui' },
    { name: 'description', content: 'View component documentation' },
  ];
}

export default function ViewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">View 视图</h1>
        <p className="text-muted-foreground">
          基础容器组件，用于布局和内容包裹。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-col gap-4">
          <ZView className="p-4 border rounded-md">Default View</ZView>
          <ZView
            className="p-4 rounded-md text-white"
            backgroundColor="#3b82f6"
          >
            View with background color
          </ZView>
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
                <td className="p-4 font-mono">backgroundColor</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">背景颜色</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">...props</td>
                <td className="p-4 font-mono text-muted-foreground">
                  React.HTMLAttributes
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">
                  支持所有原生 div 属性（如 className, style, onClick 等）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
