import { ZAvatar } from '@zcat/ui';

import type { Route } from './+types/avatar-page';

export function meta() {
  return [
    { title: 'Avatar - @zcat/ui' },
    { name: 'description', content: 'Avatar component documentation' },
  ];
}

export default function AvatarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Avatar 头像</h1>
        <p className="text-muted-foreground">
          用来代表用户或事物的图标、图片或字符。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-wrap gap-4">
          <ZAvatar
            src="https://github.com/shadcn.png"
            alt="@shadcn"
            fallback="CN"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Sizes</h2>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex flex-col items-center gap-2">
            <ZAvatar
              size="sm"
              src="https://github.com/shadcn.png"
              alt="@shadcn"
              fallback="S"
            />
            <span className="text-sm text-muted-foreground">sm</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ZAvatar
              size="md"
              src="https://github.com/shadcn.png"
              alt="@shadcn"
              fallback="M"
            />
            <span className="text-sm text-muted-foreground">md (default)</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <ZAvatar
              size="lg"
              src="https://github.com/shadcn.png"
              alt="@shadcn"
              fallback="L"
            />
            <span className="text-sm text-muted-foreground">lg</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Fallbacks</h2>
        <div className="flex flex-wrap gap-4">
          <ZAvatar alt="No Image" fallback="Z" />
          <ZAvatar alt="No Image" fallback="Cat" />
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
                <td className="p-4 font-mono">src</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">图片地址</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">alt</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">图片无法显示时的替代文本（必须）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">fallback</td>
                <td className="p-4 font-mono text-muted-foreground">
                  ReactNode
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">图片加载失败或未设置时显示的内容</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">size</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;sm&apos; | &apos;md&apos; | &apos;lg&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;md&apos;
                </td>
                <td className="p-4">头像尺寸</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
