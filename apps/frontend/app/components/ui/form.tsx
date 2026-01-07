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

import { zodResolver } from '@hookform/resolvers/zod';

import useConstant from 'use-constant';
import { Label, type LabelSpan } from './label';
import { useLoadingFn } from '../hooks';
import { classnames } from '../utils';
import { LoadingOutlined } from '@ant-design/icons';

interface FormProps<TFieldValues extends FieldValues = FieldValues> {
  className?: string;
  children: React.ReactNode;
  form: FormInstance<TFieldValues>;
}

/**
 * 表单
 * @template TFieldValues
 * @param props
 * @returns
 */
export function Form<TFieldValues extends FieldValues = FieldValues>(
  props: FormProps<TFieldValues>,
) {
  const { children, form } = props;

  const submit = useLoadingFn(form.submit);

  return (
    <form
      className={classnames('relative flex flex-col gap-5', props.className)}
      onSubmit={submit}
    >
      {children}
      {submit.loading ? (
        <div className="absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center">
          <LoadingOutlined style={{ fontSize: 36 }} />
        </div>
      ) : null}
    </form>
  );
}

/**
 * 表单项子元素属性
 */
interface FormItemChildrenProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<TFieldValues>;
}

/**
 * 表单项子元素
 */
type FormItemChildren<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> =
  | ((props: FormItemChildrenProps<TFieldValues, TName>) => React.ReactElement)
  | React.ReactElement<any>;

/**
 * 表单项属性
 */
interface FormItemProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
> {
  form: FormInstance<TFieldValues, TTransformedValues>;
  name: TName;
  label: string;
  span?: LabelSpan;
  children: FormItemChildren<TFieldValues, TName>;
}

/**
 * 表单项
 * @template TFieldValues
 * @template TName
 * @template TTransformedValues
 * @param {FormItemProps<TFieldValues, TName, TTransformedValues>} props
 * @returns {React.ReactElement}
 */
function FormItem<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  TTransformedValues = TFieldValues,
>(
  props: FormItemProps<TFieldValues, TName, TTransformedValues>,
): React.ReactElement {
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
        return (
          <Label label={label} span={props.span}>
            {render(renderProps)}
          </Label>
        );
      }}
    />
  );
}

/**
 *
 */
interface UseFormProps<TFieldValues extends FieldValues = FieldValues> {
  initialValues: TFieldValues;
  schema?: Parameters<typeof zodResolver>[0];
  onSubmit: (data: TFieldValues) => Promise<void> | void;
}

/**
 *
 */
interface FormInstance<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues = TFieldValues,
> {
  submit: () => Promise<void>;
  control: Control<TFieldValues, TTransformedValues>;
  watch: UseFormWatch<TFieldValues>;
}

/**
 * @template TFieldValues
 * @param {UseFormProps<TFieldValues>} props
 * @returns {FormInstance<TFieldValues, TTransformedValues>}
 */
function useForm<
  TFieldValues extends FieldValues = FieldValues,
  TTransformedValues extends FieldValues = TFieldValues,
>(
  props: UseFormProps<TFieldValues>,
): FormInstance<TFieldValues, TTransformedValues> {
  const formReturn = useReactHookForm<TFieldValues, TTransformedValues>({
    defaultValues: props.initialValues as DefaultValues<TFieldValues>,
    resolver: props.schema
      ? zodResolver<TFieldValues, TTransformedValues, TFieldValues>(
          props.schema as any,
        )
      : undefined,
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
