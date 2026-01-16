import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import zod from 'zod';

import { ZForm, ZFormProps } from './z-form';
import { ZFormItem, type ZFormFieldProps } from './z-form-item';
import { ZFormItems } from './z-form-items';

import type { FieldPath, FieldValues, UseReactFormProps } from './types';

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
function createUseZForm<T extends FieldValues>(schema: zod.ZodObject<T>) {
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
interface ZFormType<T extends FieldValues> {
  (props: ZFormProps<ZodInferValues<T>>): React.ReactElement;

  useForm: ReturnType<typeof createUseZForm<T>>;

  Items: typeof ZFormItems;

  Item<K extends FieldPath<ZodInferValues<T>>>(
    props: ZFormFieldProps<ZodInferValues<T>, K>,
  ): React.ReactElement;
}

/**
 * 创建一个基于 zod 校验的表单
 * @template T 表单字段的校验 schema 类型
 * @param {T} shape 表单字段的校验 schema
 * @returns {ZFormMaker<T>}一个基于 zod 校验的表单
 */
export function createZForm<T extends FieldValues>(
  shape: T | zod.ZodObject<T>,
): ZFormType<T> {
  // normalize schema
  let schema: zod.ZodObject<T>;
  if (shape instanceof zod.ZodObject) {
    schema = shape;
  } else {
    schema = zod.object(shape);
  }

  //
  const Form = ZForm.bind(null) as ZFormType<T>;
  Form.useForm = createUseZForm<T>(schema);
  Form.Items = ZFormItems;
  Form.Item = ZFormItem;

  return Form;
}
