import { QRCodeSVG } from 'qrcode.react';
import React from 'react';

import { cn } from '../../shadcn/lib/utils';

export interface ZQRCodeProps extends React.ComponentProps<typeof QRCodeSVG> {
  className?: string;
  wrapperClassName?: string;
}

export const ZQRCode = React.forwardRef<SVGSVGElement, ZQRCodeProps>(
  ({ className, wrapperClassName, value, size = 128, ...props }, ref) => {
    return (
      <div
        className={cn(
          'inline-flex bg-white p-2 rounded-lg border border-border',
          wrapperClassName,
        )}
      >
        <QRCodeSVG
          ref={ref}
          value={value}
          size={size}
          className={cn(className)}
          {...props}
        />
      </div>
    );
  },
);

ZQRCode.displayName = 'ZQRCode';
