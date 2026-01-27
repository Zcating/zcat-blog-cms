import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Button - @zcat/ui' },
    { name: 'description', content: 'Button component documentation' },
  ];
}

const exampleContent = `
# Button 按钮

常用的操作按钮。

## Variants

\`\`\`typescript-demo
import { ZButton } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZButton variant="default">Default</ZButton>
      <ZButton variant="secondary">Secondary</ZButton>
      <ZButton variant="destructive">Destructive</ZButton>
      <ZButton variant="outline">Outline</ZButton>
      <ZButton variant="ghost">Ghost</ZButton>
      <ZButton variant="link">Link</ZButton>
    </div>
  );
}
\`\`\`

## Sizes

\`\`\`typescript-demo
import { ZButton } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ZButton size="sm">Small</ZButton>
      <ZButton size="default">Default</ZButton>
      <ZButton size="lg">Large</ZButton>
      <ZButton size="xl">Extra Large</ZButton>
    </div>
  );
}
\`\`\`

## Icon Sizes

\`\`\`typescript-demo
import { ZButton } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <ZButton size="icon-sm" variant="outline">SM</ZButton>
      <ZButton size="icon" variant="outline">MD</ZButton>
      <ZButton size="icon-lg" variant="outline">LG</ZButton>
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| variant | 'default' \\| 'destructive' \\| 'outline' \\| 'secondary' \\| 'ghost' \\| 'link' | 'default' | 按钮样式变体 |
| size | 'default' \\| 'sm' \\| 'lg' \\| 'xl' \\| 'icon' \\| 'icon-sm' \\| 'icon-lg' | 'default' | 按钮尺寸 |
| asChild | boolean | false | 是否作为子组件渲染 |
| ...props | React.ButtonHTMLAttributes | - | 支持所有原生 button 属性 |
`;

export default function ButtonPage() {
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
