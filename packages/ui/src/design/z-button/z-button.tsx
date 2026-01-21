import { Loader2 } from 'lucide-react';
import React from 'react';

import { Button } from '@zcat/ui/shadcn/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@zcat/ui/shadcn/ui/tooltip';

export interface ZButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'asChild'
> {
  loading?: boolean;
  tooltip?: React.ReactNode;
}

export function ZButton({
  loading,
  tooltip,
  disabled,
  children,
  ...restProps
}: ZButtonProps) {
  const computedDisabled = disabled || loading;

  const buttonNode = (
    <Button {...restProps} disabled={computedDisabled} asChild={false}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : null}
      {children}
    </Button>
  );

  if (!tooltip) {
    return buttonNode;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {computedDisabled ? (
          <span tabIndex={0} className="inline-flex">
            {buttonNode}
          </span>
        ) : (
          buttonNode
        )}
      </TooltipTrigger>
      <TooltipContent side="top" align="center" sideOffset={6}>
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}
