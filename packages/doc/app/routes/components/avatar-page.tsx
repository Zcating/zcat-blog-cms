import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

const exampleContent = `
# Avatar 头像

用来代表用户或事物的图标、图片或字符。

## Basic Usage

\`\`\`typescript-demo
import { ZAvatar } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZAvatar
        src="https://github.com/shadcn.png"
        alt="@shadcn"
        fallback="CN"
      />
    </div>
  );
}
\`\`\`

## Sizes

\`\`\`typescript-demo
import { ZAvatar } from '@zcat/ui';

export function DemoComponent() {
  return (
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
  );
}
\`\`\`

## Fallbacks

\`\`\`typescript-demo
import { ZAvatar } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZAvatar alt="No Image" fallback="Z" />
      <ZAvatar alt="No Image" fallback="Cat" />
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| src | string | - | 图片地址 |
| alt | string | - | 图片无法显示时的替代文本（必须） |
| fallback | ReactNode | - | 图片加载失败或未设置时显示的内容 |
| size | 'sm' \\| 'md' \\| 'lg' | 'md' | 头像尺寸 |
`;

export function meta() {
  return [
    { title: 'Avatar - @zcat/ui' },
    { name: 'description', content: 'Avatar component documentation' },
  ];
}

export default function AvatarPage() {
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
