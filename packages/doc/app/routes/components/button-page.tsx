import { ZButton } from '@zcat/ui';

import type { Route } from './+types/button-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Button - @zcat/ui' },
    { name: 'description', content: 'Button component documentation' },
  ];
}

export default function ButtonPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Button 按钮</h1>
        <p className="text-muted-foreground">常用的操作按钮。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton variant="default">Default</ZButton>
          <ZButton variant="secondary">Secondary</ZButton>
          <ZButton variant="destructive">Destructive</ZButton>
          <ZButton variant="outline">Outline</ZButton>
          <ZButton variant="ghost">Ghost</ZButton>
          <ZButton variant="link">Link</ZButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ZButton size="sm">Small</ZButton>
          <ZButton size="default">Default</ZButton>
          <ZButton size="lg">Large</ZButton>
          <ZButton size="xl">Extra Large</ZButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Icon Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ZButton size="icon-sm" variant="outline">
            SM
          </ZButton>
          <ZButton size="icon" variant="outline">
            MD
          </ZButton>
          <ZButton size="icon-lg" variant="outline">
            LG
          </ZButton>
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
                <td className="p-4 font-mono">variant</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;default&apos; | &apos;destructive&apos; |
                  &apos;outline&apos; | &apos;secondary&apos; |
                  &apos;ghost&apos; | &apos;link&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;default&apos;
                </td>
                <td className="p-4">按钮样式变体</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">size</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;default&apos; | &apos;sm&apos; | &apos;lg&apos; |
                  &apos;xl&apos; | &apos;icon&apos; | &apos;icon-sm&apos; |
                  &apos;icon-lg&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;default&apos;
                </td>
                <td className="p-4">按钮尺寸</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">asChild</td>
                <td className="p-4 font-mono text-muted-foreground">boolean</td>
                <td className="p-4 font-mono text-muted-foreground">false</td>
                <td className="p-4">
                  是否作为子组件渲染（用于合并 Props，例如配合 Tooltip 使用）
                </td>
              </tr>
              <tr>
                <td className="p-4 font-mono">...props</td>
                <td className="p-4 font-mono text-muted-foreground">
                  React.ButtonHTMLAttributes
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">
                  支持所有原生 button 属性（如 onClick, disabled 等）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
