import React from 'react';

import { Form } from '@zcat/ui/shadcn/ui/form';

import { ZFormContext } from './z-form-context';

import type { FieldValues, UseZFormReturn } from './types';

export interface ZFormProps<T extends FieldValues> {
  className?: string;
  form: UseZFormReturn<T>;
  children: React.ReactNode;
}

export function ZForm<T extends FieldValues>(props: ZFormProps<T>) {
  const { instance, submit } = props.form;
  const onSubmit = instance.handleSubmit(submit);
  return (
    <ZFormContext.Provider value={instance}>
      <Form {...instance}>
        <form onSubmit={onSubmit} className={props.className}>
          {props.children}
        </form>
      </Form>
    </ZFormContext.Provider>
  );
}
