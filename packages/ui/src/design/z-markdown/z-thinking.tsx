import React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@zcat/ui/shadcn';

export interface ZThinkingProps {
  children: React.ReactNode;
  className?: string;
}

export function ZThinking({ children, className }: ZThinkingProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center gap-2 px-4 py-2">
        <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
        <CardTitle>Thinking...</CardTitle>
      </CardHeader>
      <CardContent className="py-3 px-4">
        <div className="text-sm whitespace-pre-wrap">{children}</div>
      </CardContent>
    </Card>
  );
}
