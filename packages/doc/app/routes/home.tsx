import { ZAvatar, ZButton } from '@zcat/ui';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">z-ui 组件展示</h1>
        <p className="text-muted-foreground">
          这里展示了 z-ui 库中的常用组件。
        </p>
        <ZButton>默认按钮</ZButton>
      </div>
    </div>
  );
}
