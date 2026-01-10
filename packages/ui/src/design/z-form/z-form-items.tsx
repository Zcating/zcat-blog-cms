import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zcat-cms/z-components/ui/card';
import React from 'react';

export type ZFormItemsProps = React.ComponentProps<'div'> & {
  title?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

export function ZFormItems({
  title,
  header,
  footer,
  ...props
}: ZFormItemsProps) {
  return (
    <Card {...props}>
      {title ? (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      ) : null}
      {header ? <CardHeader>{header}</CardHeader> : null}
      <CardContent className="flex flex-col gap-5">
        {props.children}
      </CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
