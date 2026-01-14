import { ZImage } from '@zcat/ui';
import type { Route } from './+types/z-image-page';

export function meta({}: Route.MetaArgs) {
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
        <p className="text-muted-foreground">用于展示图片的组件，支持多种填充模式。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-wrap gap-4">
          <ZImage
            src={src}
            alt="Basic usage"
            className="h-[200px] w-[300px]"
          />
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
    </div>
  );
}
