import { Button, ZView } from '@zcat/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React from 'react';

export interface GallerySidebarNavProps {
  /** 当前选中的索引 */
  value: number;
  /** 总数量 */
  count: number;
  /** 索引变更回调 */
  onValueChange: (value: number) => void;
  className?: string;
}

export function GallerySidebarNav({
  value,
  count,
  onValueChange,
  className,
}: GallerySidebarNavProps) {
  return (
    <ZView className={`p-4 border-t bg-muted/20 ${className || ''}`}>
      <ZView className="flex justify-between items-center">
        <Button
          variant="outline"
          size="icon"
          disabled={value <= 0}
          onClick={() => onValueChange(Math.max(0, value - 1))}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <span className="text-sm text-muted-foreground">导航</span>
        <Button
          variant="outline"
          size="icon"
          disabled={value >= count - 1}
          onClick={() => onValueChange(Math.min(count - 1, value + 1))}
        >
          <ArrowRight className="size-4" />
        </Button>
      </ZView>
    </ZView>
  );
}
