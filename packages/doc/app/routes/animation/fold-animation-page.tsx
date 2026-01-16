import { Button, FoldAnimation, ZView } from '@zcat/ui';
import { useState } from 'react';

import { DemoContainer } from '~/features';

import type { Route } from './+types/fold-animation-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: '折叠动画 - @zcat/ui' },
    {
      name: 'description',
      content: 'FoldAnimation 动画组件文档',
    },
  ];
}

export default function FoldAnimationPage() {
  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  return (
    <div className="space-y-10 pb-10">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">FoldAnimation</h1>
        <p className="text-muted-foreground">
          用于平滑展开和收起内容的动画组件，基于 GSAP 实现。常用于手风琴、折叠面板等场景。
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          基础用法 (Basic Usage)
        </h2>
        <p className="text-sm text-muted-foreground">
          通过控制 `isOpen` 属性 (boolean) 来切换展开和收起状态。
        </p>
        <DemoContainer>
          <div className="space-y-4">
            <Button onClick={() => setIsOpen1(!isOpen1)}>
              {isOpen1 ? '收起' : '展开'}
            </Button>
            <FoldAnimation isOpen={isOpen1}>
              <div className="rounded-lg border bg-muted/50 p-4 text-sm text-muted-foreground">
                这是一个可以展开和收起的内容区域。
                <br />
                FoldAnimation 组件会自动处理高度和透明度的动画。
              </div>
            </FoldAnimation>
          </div>
        </DemoContainer>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">
          自定义时长 (Custom Duration)
        </h2>
        <p className="text-sm text-muted-foreground">
          使用 `duration` 属性 (number) 自定义动画持续时间，单位为秒。
        </p>
        <DemoContainer>
          <div className="space-y-4">
            <Button onClick={() => setIsOpen2(!isOpen2)}>
              {isOpen2 ? '快速收起' : '慢速展开'} (1s)
            </Button>
            <FoldAnimation isOpen={isOpen2} duration={1}>
              <ZView className="h-32 w-full rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                自定义 1 秒动画时长
              </ZView>
            </FoldAnimation>
          </div>
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
                <td className="p-4 font-mono">isOpen</td>
                <td className="p-4 font-mono text-muted-foreground">boolean</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">是否展开</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">duration</td>
                <td className="p-4 font-mono text-muted-foreground">number</td>
                <td className="p-4 font-mono text-muted-foreground">0.3</td>
                <td className="p-4">动画持续时间（秒）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">children</td>
                <td className="p-4 font-mono text-muted-foreground">ReactNode</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">内容</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
