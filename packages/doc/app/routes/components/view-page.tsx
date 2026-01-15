import { ZView } from '@zcat/ui';

import type { Route } from './+types/view-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'View - @zcat/ui' },
    { name: 'description', content: 'View component documentation' },
  ];
}

export default function ViewPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">View 视图</h1>
        <p className="text-muted-foreground">
          基础容器组件，用于布局和内容包裹。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-col gap-4">
          <ZView className="p-4 border rounded-md">Default View</ZView>
          <ZView
            className="p-4 rounded-md text-white"
            backgroundColor="#3b82f6"
          >
            View with background color
          </ZView>
        </div>
      </div>
    </div>
  );
}
