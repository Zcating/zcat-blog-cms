import { ChevronDown, Copy } from 'lucide-react';
import React from 'react';

import { FoldAnimation } from '@zcat/ui/animation';
import { useToggleValue } from '@zcat/ui/hooks';
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@zcat/ui/shadcn';
import { cn } from '@zcat/ui/shadcn/lib/utils';
import { copyToClipboard } from '@zcat/ui/utils';

import { Button } from '../../shadcn/ui/button';

export interface ZCodeCardProps {
  language?: string;
  children: React.ReactNode;
  className?: string;
  defaultCollapsed?: boolean;
}

export function ZCodeCard({
  language,
  children,
  className,
  defaultCollapsed = true,
}: ZCodeCardProps) {
  const [isCollapsed, onToggleCollapsed] = useToggleValue(defaultCollapsed);

  const onCopy = async () => {
    await copyToClipboard(children);
  };

  return (
    <Card className={cn('py-0 gap-0', className)}>
      <CardHeader className="flex items-center bg-accent/50 justify-between px-4 py-2">
        <CardTitle className="text-markdown-code-lang">{language}</CardTitle>
        <CardAction className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onCopy}>
            <Copy className="text-gray-500" size={14} />
            <p>复制</p>
          </Button>
          <Button size="sm" variant="outline" onClick={onToggleCollapsed}>
            <ChevronDown
              className={cn(
                'transition-transform duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none',
                isCollapsed ? 'rotate-180' : 'rotate-360',
              )}
              size={14}
            />
            <p>{isCollapsed ? '折叠' : '展开'}</p>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="py-3 px-0!">
        <FoldAnimation isOpen={isCollapsed}>{children}</FoldAnimation>
      </CardContent>
    </Card>
  );
}
