import { Button, ZView } from '@zcat/ui';
import { RotateCcw } from 'lucide-react';
import React from 'react';

export function DemoContainer({ children }: { children: React.ReactNode }) {
  const [key, updateKey] = React.useState(0);

  return (
    <ZView className="relative rounded-lg border p-6">
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-2 z-10"
        onClick={() => updateKey((k) => k + 1)}
        title="重新播放动画"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <ZView key={key}>{children}</ZView>
    </ZView>
  );
}
