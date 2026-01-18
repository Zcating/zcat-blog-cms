import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@zcat/ui/shadcn/ui/button';

export interface ZButtonProps extends React.ComponentProps<typeof Button> {
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
    <Button disabled={computedDisabled} {...restProps}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );
}
