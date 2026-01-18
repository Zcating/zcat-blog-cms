import {
  type FieldPath,
  type FieldValues,
  type SubmitHandler,
  type UseFormProps,
  type UseFormReturn,
} from 'react-hook-form';

export type { FieldPath, FieldValues };
export type UseReactFormProps<T extends FieldValues> = UseFormProps<T>;
export type UseReactFormReturnType<T extends FieldValues> = UseFormReturn<T>;

export type UseZFormReturn<T extends FieldValues> = {
  instance: UseReactFormReturnType<T>;
  submit: SubmitHandler<T>;
};
