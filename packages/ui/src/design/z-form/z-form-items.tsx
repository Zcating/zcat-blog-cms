import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@zcat/ui/shadcn/ui/card';

export type ZFormItemsProps = React.ComponentProps<'div'> & {
  title?: string;
  description?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
};

export function ZFormItems({
  title,
  description,
  header,
  footer,
  ...props
}: ZFormItemsProps) {
  return (
    <Card {...props}>
      <CardHeader>
        {title ? <CardTitle>{title}</CardTitle> : null}
        {description ? <CardDescription>{description}</CardDescription> : null}
        {header ? header : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {props.children}
      </CardContent>
      {footer ? <CardFooter>{footer}</CardFooter> : null}
    </Card>
  );
}
