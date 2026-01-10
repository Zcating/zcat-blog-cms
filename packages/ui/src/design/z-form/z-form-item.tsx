import React from 'react';
import type { FieldValues, FieldPath } from './types';
import { ZFormContext } from './z-form-context';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@zcat/ui/shadcn/ui/form';

export interface ZFormFieldProps<
  T extends FieldValues,
  K extends FieldPath<T> = FieldPath<T>,
> {
  label?: string;
  name: K;
  description?: string;
  children: React.ReactElement<any>;
}

export function ZFormItem<T extends FieldValues, K extends FieldPath<T>>(
  props: ZFormFieldProps<T, K>,
) {
  const instance = React.useContext(ZFormContext);
  if (!instance) {
    throw new Error('ZFormItem must be used within a ZForm');
  }
  return (
    <FormField
      key={props.name}
      control={instance.control}
      name={props.name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{props.label}</FormLabel>
          <FormControl>
            {React.cloneElement(props.children, {
              ...props.children.props,
              ...field,
              onValueChange: field.onChange,
            })}
          </FormControl>
          {props.description && (
            <FormDescription>{props.description}</FormDescription>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
