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
    </div>
  );
}
