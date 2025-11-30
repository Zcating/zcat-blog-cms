import React from "react";
import { useForm } from "react-hook-form";
import { Form } from "@blog/components/ui/form";

import { zodResolver } from "@hookform/resolvers/zod";
import zod from "zod";
import type {
  FieldPath,
  FieldValues,
  UseReactFormProps,
  UseZFormReturn,
} from "./types";
import { ZFormItems } from "./z-form-items";
import { ZFormItem, type ZFormFieldProps } from "./z-form-item";
import { ZFormContext } from "./z-form-context";

interface ZFormProps<T extends FieldValues> {
  className?: string;
  form: UseZFormReturn<T>;
  children: React.ReactNode;
}

function ZForm<T extends FieldValues>(props: ZFormProps<T>) {
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

type ZodInferValues<T extends FieldValues> = zod.infer<zod.ZodObject<T>>;

// 基于 zod 校验的表单 props
type UseZFormProps<T extends FieldValues> = UseReactFormProps<T> & {
  onSubmit: (data: T) => void;
};

/**
 * 创建一个基于 zod 校验的表单 hook
 * @template T 表单字段的校验 schema 类型
 * @template TTransformedValues 表单字段的转换值类型
 * @param {zod.ZodObject<T>} schema 表单字段的校验 schema
 */
function createUseZForm<
  T extends FieldValues,
  TTransformedValues = FieldValues,
>(schema: zod.ZodObject<T>) {
  return ({ onSubmit, ...props }: UseZFormProps<ZodInferValues<T>>) => {
    const form = useForm<ZodInferValues<T>>({
      resolver: zodResolver(schema) as any,
      ...props,
    });
    return {
      instance: form,
      submit: onSubmit,
    };
  };
}

// 基于 zod 校验的表单 maker
interface ZFormMaker<T extends FieldValues> {
  useForm: ReturnType<typeof createUseZForm<T, T>>;

  Form: typeof ZForm<ZodInferValues<T>>;

  FormItems: typeof ZFormItems;

  FormItem<K extends FieldPath<ZodInferValues<T>>>(
    props: ZFormFieldProps<ZodInferValues<T>, K>,
  ): React.ReactElement;
}

/**
 * 创建一个基于 zod 校验的表单 maker
 * @template T 表单字段的校验 schema 类型
 * @template TTransformedValues 表单字段的转换值类型
 * @param {T} shape 表单字段的校验 schema
 * @returns {ZFormMaker<T, TTransformedValues>}一个基于 zod 校验的表单 maker
 */
export function createZFormMaker<
  T extends FieldValues,
  TTransformedValues = FieldValues,
>(shape: T): ZFormMaker<T> {
  //
  const schema = zod.object(shape);

  //
  const useZForm = createUseZForm<T, TTransformedValues>(schema);

  return {
    useForm: useZForm,
    Form: ZForm as any,
    FormItems: ZFormItems,
    FormItem: ZFormItem,
  };
}
