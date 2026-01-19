import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@zcat/ui/shadcn/ui/button';

export interface ZButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'asChild'
> {
  loading?: boolean;
}

export function ZButton({
  loading,
  disabled,
  children,
  ...restProps
}: ZButtonProps) {
  const computedDisabled = disabled || loading;

  return (
    <Button {...restProps} disabled={computedDisabled} asChild={false}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
