import { ZImage } from '@zcat/ui';

import type { Route } from './+types/z-image-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Image - @zcat/ui' },
    { name: 'description', content: 'Image component documentation' },
  ];
}

export default function ImagePage() {
  const src = 'https://placehold.co/300x200';

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Image 图片</h1>
        <p className="text-muted-foreground">
          用于展示图片的组件，支持多种填充模式。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-wrap gap-4">
          <ZImage src={src} alt="Basic usage" className="h-[200px] w-[300px]" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Content Modes</h2>
        <div className="flex flex-wrap gap-8">
          <div className="space-y-2">
            <p className="font-medium">Cover (Default)</p>
            <div className="h-[200px] w-[200px] overflow-hidden border">
              <ZImage
                src={src}
                alt="Cover"
                contentMode="cover"
                className="h-full w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Contain</p>
            <div className="h-[200px] w-[200px] overflow-hidden border">
              <ZImage
                src={src}
                alt="Contain"
                contentMode="contain"
                className="h-full w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Fill</p>
            <div className="h-[200px] w-[200px] overflow-hidden border">
              <ZImage
                src={src}
                alt="Fill"
                contentMode="fill"
                className="h-full w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">None</p>
            <div className="h-[200px] w-[200px] overflow-hidden border">
              <ZImage
                src={src}
                alt="None"
                contentMode="none"
                className="h-full w-full"
              />
            </div>
          </div>
          <div className="space-y-2">
            <p className="font-medium">Scale Down</p>
            <div className="h-[200px] w-[200px] overflow-hidden border">
              <ZImage
                src={src}
                alt="Scale Down"
                contentMode="scale-down"
                className="h-full w-full"
              />
            </div>
          </div>
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
                <td className="p-4">图片描述</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">contentMode</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;cover&apos; | &apos;contain&apos; | &apos;fill&apos; |
                  &apos;none&apos; | &apos;scale-down&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;cover&apos;
                </td>
                <td className="p-4">图片填充模式</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">...props</td>
                <td className="p-4 font-mono text-muted-foreground">
                  React.ImgHTMLAttributes
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">
                  支持所有原生 img 属性（如 width, height, loading 等）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
