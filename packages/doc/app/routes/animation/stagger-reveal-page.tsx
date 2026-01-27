import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: '交错动画 - @zcat/ui' },
    {
      name: 'description',
      content: 'StaggerReveal animation component documentation',
    },
  ];
}

const exampleContent = `
# StaggerReveal

依次显示元素的交错动画组件，基于 GSAP 实现。

## Basic Usage (Left)

默认从左侧滑入 (\`direction="left"\`)。需要提供 \`selector\` 属性来指定需要动画的子元素。

\`\`\`typescript-demo
import { StaggerReveal, ZView } from '@zcat/ui';

function DemoBox({ index }: { index: number }) {
  return (
    <ZView className="reveal-item flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
      {index + 1}
    </ZView>
  );
}

export function DemoComponent() {
  return (
    <StaggerReveal selector=".reveal-item" className="flex flex-wrap gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <DemoBox key={i} index={i} />
      ))}
    </StaggerReveal>
  );
}
\`\`\`

## Direction

可以设置不同的动画进入方向。

\`\`\`typescript-demo
import { StaggerReveal, ZView } from '@zcat/ui';

function DemoBox({ index }: { index: number }) {
  return (
    <ZView className="reveal-item flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
      {index + 1}
    </ZView>
  );
}

export function DemoComponent() {
  return (
    <div className="space-y-8">
      <div>
        <p className="font-medium mb-4">Bottom (从下方滑入)</p>
        <StaggerReveal selector=".reveal-item" direction="bottom" className="flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <DemoBox key={i} index={i} />
          ))}
        </StaggerReveal>
      </div>
      <div>
        <p className="font-medium mb-4">Top (从上方滑入)</p>
        <StaggerReveal selector=".reveal-item" direction="top" className="flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <DemoBox key={i} index={i} />
          ))}
        </StaggerReveal>
      </div>
      <div>
        <p className="font-medium mb-4">Right (从右侧滑入)</p>
        <StaggerReveal selector=".reveal-item" direction="right" className="flex flex-wrap gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <DemoBox key={i} index={i} />
          ))}
        </StaggerReveal>
      </div>
    </div>
  );
}
\`\`\`

## Custom Options

可以通过 \`duration\` (持续时间), \`stagger\` (间隔时间), \`ease\` (缓动函数) 来调整动画效果。

\`\`\`typescript-demo
import { StaggerReveal, ZView } from '@zcat/ui';

function DemoBox({ index }: { index: number }) {
  return (
    <ZView className="reveal-item flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
      {index + 1}
    </ZView>
  );
}

export function DemoComponent() {
  return (
    <StaggerReveal
      selector=".reveal-item"
      direction="bottom"
      duration={0.5}
      stagger={0.2}
      ease="back.out(1.7)"
      className="flex flex-wrap gap-4"
    >
      {Array.from({ length: 8 }).map((_, i) => (
        <DemoBox key={i} index={i} />
      ))}
    </StaggerReveal>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| selector | string | - | CSS 选择器，用于选择需要执行动画的子元素 |
| direction | 'left' \\| 'right' \\| 'top' \\| 'bottom' | 'left' | 动画进入的方向 |
| duration | number | 0.85 | 动画持续时间（秒） |
| stagger | number | 0.06 | 每个元素动画之间的间隔时间（秒） |
| ease | string | 'power2.out' | GSAP 缓动函数 |
| dependencies | unknown[] | [] | 依赖项数组，当依赖项变化时重新执行动画 |
| className | string | - | 自定义类名 |
`;

export default function StaggerRevealPage() {
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
