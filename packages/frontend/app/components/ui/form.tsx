import React from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type FieldPath,
  type ControllerRenderProps,
  type ControllerFieldState,
  type UseFormStateReturn,
  useForm as useReactHookForm,
  type DefaultValues,
  type UseFormWatch,
} from 'react-hook-form';

import useConstant from 'use-constant';
import { Label } from './label';

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  className?: string;
  children: React.ReactNode;
  form: FormInstance<TFieldValues>;
}

export function Form<TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>,
) {
  const { children, form } = props;

  return (
    <form className={props.className} onSubmit={form.submit}>
      {children}
    </form>
  );
}

interface FormItemChildrenProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFieldValues>;
}

type FormItemChildren<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | ((props: FormItemChildrenProps<TFieldValues, TName>) => React.ReactElement)
  | React.ReactElement<any>;

interface FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  form: FormInstance<TFieldValues, TTransformedValues>;
  name: TName;
  label: string;
  children: FormItemChildren<TFieldValues, TName>;
}

function FormItem<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(props: FormItemProps<TFieldValues, TName, TTransformedValues>) {
  const { form, name, label, children } = props;

  const render = React.useMemo(() => {
    if (typeof children === 'function') {
      return children;
    } else if (React.isValidElement(children)) {
      return (props: FormItemChildrenProps<TFieldValues, TName>) => {
        return React.cloneElement(children, {
          ...(children.props as any),
          ...props.field,
        });
      };
    } else {
      return () => undefined as any;
    }
  }, [children]);

  return (
    <Controller
      control={form.control}
      name={name}
      render={(renderProps) => {
        return <Label label={label}>{render(renderProps)}</Label>;
      }}
    />
  );
}

interface UseFormProps<TFieldValues extends FieldValues = FieldValues> {
  initialValues: TFieldValues;
  onSubmit: (data: TFieldValues) => void;
}

interface FormInstance<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues = TFieldValues,
> {
  submit: () => void;
  control: Control<TFieldValues, TTransformedValues>;
  watch: UseFormWatch<TFieldValues>;
}

function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues = TFieldValues,
>(
  props: UseFormProps<TFieldValues>,
): FormInstance<TFieldValues, TTransformedValues> {
  const formReturn = useReactHookForm<TFieldValues, TTransformedValues>({
    defaultValues: props.initialValues as DefaultValues<TFieldValues>,
  });

  const submit = formReturn.handleSubmit(props.onSubmit);

  return useConstant(() => ({
    // ...formReturn,
    submit,
    control: formReturn.control,
    watch: formReturn.watch,
  }));
}

Form.Item = FormItem;
Form.useForm = useForm;
