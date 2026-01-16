import { StaggerReveal, ZView } from '@zcat/ui';

import { DemoContainer } from '~/features';

import type { Route } from './+types/stagger-reveal-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: '交错动画 - @zcat/ui' },
    {
      name: 'description',
      content: 'StaggerReveal animation component documentation',
    },
  ];
}

function DemoBox({ index }: { index: number }) {
  return (
    <ZView className="reveal-item flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
      {index + 1}
    </ZView>
  );
}

export default function StaggerRevealPage() {
  return (
    <div className="space-y-10 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">StaggerReveal</h1>
        <p className="text-muted-foreground">
          依次显示元素的交错动画组件，基于 GSAP 实现。
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          基础用法 (Default / Left)
        </h2>
        <p className="text-sm text-muted-foreground">
          默认从左侧滑入 (`direction=&quot;left&quot;`)。需要提供 `selector`
          属性来指定需要动画的子元素。
        </p>
        <DemoContainer>
          <StaggerReveal
            selector=".reveal-item"
            className="flex flex-wrap gap-4"
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <DemoBox key={i} index={i} />
            ))}
          </StaggerReveal>
        </DemoContainer>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          方向控制 (Direction)
        </h2>

        <div className="space-y-4">
          <h3 className="font-medium">Bottom (从下方滑入)</h3>
          <DemoContainer>
            <StaggerReveal
              selector=".reveal-item"
              direction="bottom"
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </DemoContainer>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Top (从上方滑入)</h3>
          <DemoContainer>
            <StaggerReveal
              selector=".reveal-item"
              direction="top"
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </DemoContainer>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Right (从右侧滑入)</h3>
          <DemoContainer>
            <StaggerReveal
              selector=".reveal-item"
              direction="right"
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </DemoContainer>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">自定义参数</h2>
        <p className="text-sm text-muted-foreground">
          可以通过 `duration` (持续时间), `stagger` (间隔时间), `ease`
          (缓动函数) 来调整动画效果。
        </p>
        <DemoContainer>
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
        </DemoContainer>
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
                <td className="p-4 font-mono">selector</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">
                  CSS 选择器，用于选择需要执行动画的子元素
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">direction</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;left&apos; | &apos;right&apos; | &apos;top&apos; |
                  &apos;bottom&apos;
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;left&apos;
                </td>
                <td className="p-4">动画进入的方向</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">duration</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">0.85</td>
                <td className="p-4">动画持续时间（秒）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">stagger</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">0.06</td>
                <td className="p-4">每个元素动画之间的间隔时间（秒）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">ease</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;power2.out&apos;
                </td>
                <td className="p-4">GSAP 缓动函数</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">dependencies</td>
                <td className="p-4 font-mono text-muted-foreground">
                  unknown[]
                </td>
                <td className="p-4 font-mono text-muted-foreground">[]</td>
                <td className="p-4">依赖项数组，当依赖项变化时重新执行动画</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
