import React from 'react';

export type ZViewProps = React.ComponentProps<'div'> & {
  backgroundColor?: string;
};

export const ZView = React.forwardRef<HTMLDivElement, ZViewProps>(
  (props: ZViewProps, ref) => {
    const { backgroundColor, ...rest } = props;
    return <div ref={ref} {...rest} style={{ backgroundColor }} />;
  },
);

ZView.displayName = 'ZView';
