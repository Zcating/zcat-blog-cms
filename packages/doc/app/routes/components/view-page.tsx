import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'View - @zcat/ui' },
    { name: 'description', content: 'View component documentation' },
  ];
}

const exampleContent = `
# View 视图

基础容器组件，用于布局和内容包裹。

## Basic Usage

\`\`\`typescript-demo
import { ZView } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-col gap-4">
      <ZView className="p-4 border rounded-md">Default View</ZView>
      <ZView
        className="p-4 rounded-md text-white"
        backgroundColor="#3b82f6"
      >
        View with background color
      </ZView>
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| backgroundColor | string | - | 背景颜色 |
| ...props | React.HTMLAttributes | - | 支持所有原生 div 属性 |
`;

export default function ViewPage() {
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
