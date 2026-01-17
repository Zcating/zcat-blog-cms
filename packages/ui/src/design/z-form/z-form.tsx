import React from 'react';

import { cn } from '@zcat/ui/shadcn/lib/utils';
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
  const { isSubmitting } = instance.formState;

  return (
    <ZFormContext.Provider value={instance}>
      <Form {...instance}>
        <form onSubmit={onSubmit} className="w-full">
          <fieldset
            disabled={isSubmitting}
            className={cn('min-w-0 border-0 p-0 m-0 w-full', props.className)}
          >
            {props.children}
          </fieldset>
        </form>
      </Form>
    </ZFormContext.Provider>
  );
}
