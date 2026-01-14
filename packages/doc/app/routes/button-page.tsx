import { ZButton } from '@zcat/ui';
import type { Route } from './+types/button-page';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Button - @zcat/ui' },
    { name: 'description', content: 'Button component documentation' },
  ];
}

export default function ButtonPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Button 按钮</h1>
        <p className="text-muted-foreground">常用的操作按钮。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Variants</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton variant="default">Default</ZButton>
          <ZButton variant="secondary">Secondary</ZButton>
          <ZButton variant="destructive">Destructive</ZButton>
          <ZButton variant="outline">Outline</ZButton>
          <ZButton variant="ghost">Ghost</ZButton>
          <ZButton variant="link">Link</ZButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ZButton size="sm">Small</ZButton>
          <ZButton size="default">Default</ZButton>
          <ZButton size="lg">Large</ZButton>
          <ZButton size="xl">Extra Large</ZButton>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Icon Sizes</h2>
        <div className="flex flex-wrap items-center gap-4">
          <ZButton size="icon-sm" variant="outline">
            SM
          </ZButton>
          <ZButton size="icon" variant="outline">
            MD
          </ZButton>
          <ZButton size="icon-lg" variant="outline">
            LG
          </ZButton>
        </div>
      </div>
    </div>
  );
}
