import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: '折叠动画 - @zcat/ui' },
    {
      name: 'description',
      content: 'FoldAnimation 动画组件文档',
    },
  ];
}

const exampleContent = `
# FoldAnimation

用于平滑展开和收起内容的动画组件，基于 GSAP 实现。常用于手风琴、折叠面板等场景。

## Basic Usage

通过控制 \`isOpen\` 属性 (boolean) 来切换展开和收起状态。

\`\`\`typescript-demo
import { Button, FoldAnimation } from '@zcat/ui';
import { useState } from 'react';

export function DemoComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '收起' : '展开'}
      </Button>
      <FoldAnimation isOpen={isOpen}>
        <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
          这是一个可以展开和收起的内容区域。
          <br />
          FoldAnimation 组件会自动处理高度和透明度的动画。
        </div>
      </FoldAnimation>
    </div>
  );
}
\`\`\`

## Custom Duration

使用 \`duration\` 属性 (number) 自定义动画持续时间，单位为秒。

\`\`\`typescript-demo
import { Button, FoldAnimation, ZView } from '@zcat/ui';
import { useState } from 'react';

export function DemoComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      <Button onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '快速收起' : '慢速展开'} (1s)
      </Button>
      <FoldAnimation isOpen={isOpen} duration={1}>
        <ZView className="h-32 w-full rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
          自定义 1 秒动画时长
        </ZView>
      </FoldAnimation>
    </div>
  );
}
\`\`\`
`;

export default function FoldAnimationPage() {
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
