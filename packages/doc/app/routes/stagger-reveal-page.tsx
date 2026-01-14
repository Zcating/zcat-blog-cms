import { StaggerReveal } from '@zcat/ui';
import type { Route } from './+types/stagger-reveal-page';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'StaggerReveal - @zcat/ui' },
    { name: 'description', content: 'StaggerReveal animation component documentation' },
  ];
}

function DemoBox({ index }: { index: number }) {
  return (
    <div className="reveal-item flex h-20 w-20 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold shadow-sm">
      {index + 1}
    </div>
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
        <h2 className="text-2xl font-semibold tracking-tight">基础用法 (Default / Left)</h2>
        <p className="text-sm text-muted-foreground">
          默认从左侧滑入 (`direction="left"`)。需要提供 `selector` 属性来指定需要动画的子元素。
        </p>
        <div className="rounded-lg border p-6">
          <StaggerReveal selector=".reveal-item" className="flex flex-wrap gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <DemoBox key={i} index={i} />
            ))}
          </StaggerReveal>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">方向控制 (Direction)</h2>
        
        <div className="space-y-4">
          <h3 className="font-medium">Bottom (从下方滑入)</h3>
          <div className="rounded-lg border p-6">
            <StaggerReveal 
              selector=".reveal-item" 
              direction="bottom" 
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Top (从上方滑入)</h3>
          <div className="rounded-lg border p-6">
            <StaggerReveal 
              selector=".reveal-item" 
              direction="top" 
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-medium">Right (从右侧滑入)</h3>
          <div className="rounded-lg border p-6">
            <StaggerReveal 
              selector=".reveal-item" 
              direction="right" 
              className="flex flex-wrap gap-4"
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <DemoBox key={i} index={i} />
              ))}
            </StaggerReveal>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">自定义参数</h2>
        <p className="text-sm text-muted-foreground">
          可以通过 `duration` (持续时间), `stagger` (间隔时间), `ease` (缓动函数) 来调整动画效果。
        </p>
        <div className="rounded-lg border p-6">
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
        </div>
      </div>
    </div>
  );
}
