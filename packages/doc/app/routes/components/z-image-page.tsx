import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Image - @zcat/ui' },
    { name: 'description', content: 'Image component documentation' },
  ];
}

const exampleContent = `
# Image 图片

用于展示图片的组件，支持多种填充模式。

## Basic Usage

\`\`\`typescript-demo
import { ZImage } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZImage src="https://placehold.co/300x200" alt="Basic usage" className="h-[200px] w-[300px]" />
    </div>
  );
}
\`\`\`

## Content Modes

\`\`\`typescript-demo
import { ZImage } from '@zcat/ui';

export function DemoComponent() {
  const src = 'https://placehold.co/300x200';

  return (
    <div className="flex flex-wrap gap-8">
      <div className="space-y-2">
        <p className="font-medium">Cover (Default)</p>
        <div className="h-[200px] w-[200px] overflow-hidden border">
          <ZImage src={src} alt="Cover" contentMode="cover" className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-medium">Contain</p>
        <div className="h-[200px] w-[200px] overflow-hidden border">
          <ZImage src={src} alt="Contain" contentMode="contain" className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-medium">Fill</p>
        <div className="h-[200px] w-[200px] overflow-hidden border">
          <ZImage src={src} alt="Fill" contentMode="fill" className="h-full w-full" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-medium">Scale Down</p>
        <div className="h-[200px] w-[200px] overflow-hidden border">
          <ZImage src={src} alt="Scale Down" contentMode="scale-down" className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| src | string | - | 图片地址 |
| alt | string | - | 图片描述 |
| contentMode | 'cover' \\| 'contain' \\| 'fill' \\| 'none' \\| 'scale-down' | 'cover' | 图片填充模式 |
| className | string | - | 自定义类名 |
| ...props | React.ImgHTMLAttributes | - | 支持所有原生 img 属性 |
`;

export default function ImagePage() {
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
