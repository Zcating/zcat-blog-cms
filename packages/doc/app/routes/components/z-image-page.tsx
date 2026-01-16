import { ZImage } from '@zcat/ui';

import { ApiTable } from '../../features';

import type { Route } from './+types/z-image-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Image - @zcat/ui' },
    { name: 'description', content: 'Image component documentation' },
  ];
}

const apiData = [
  {
    attribute: 'src',
    type: 'string',
    default: '-',
    description: '图片地址',
  },
  {
    attribute: 'alt',
    type: 'string',
    default: '-',
    description: '图片描述',
  },
  {
    attribute: 'contentMode',
    type: "'cover' | 'contain' | 'fill' | 'none' | 'scale-down'",
    default: "'cover'",
    description: '图片填充模式',
  },
  {
    attribute: 'className',
    type: 'string',
    default: '-',
    description: '自定义类名',
  },
  {
    attribute: '...props',
    type: 'React.ImgHTMLAttributes',
    default: '-',
    description: '支持所有原生 img 属性（如 width, height, loading 等）',
  },
];

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

      <ApiTable data={apiData} />
    </div>
  );
}
