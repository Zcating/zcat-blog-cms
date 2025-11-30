import type { Path, useForm } from "react-hook-form";

export type FieldValues = Record<string, any>;
export type FieldPath<T extends FieldValues> = Path<T>;

export type UseReactFormProps<T extends FieldValues> = Parameters<
  typeof useForm<T>
>[0];

export type UseReactFormReturnType<T extends FieldValues> = ReturnType<
  typeof useForm<T>
>;

export type UseZFormReturn<T extends FieldValues> = {
  instance: UseReactFormReturnType<T>;
  submit: (data: T) => void;
};
