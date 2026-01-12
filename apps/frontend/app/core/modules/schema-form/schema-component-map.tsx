import {
  Checkbox,
  ImageUpload,
  Input,
  Select,
  Textarea,
  type CheckboxProps,
  // type ImageUploadProps,
  type InputProps,
  type SelectProps,
  type TextareaProps,
} from '@cms/components';

import type { SchemaField } from './schema-field';

export const SCHEMA_COMPONENT_MAP = {
  select: (field: SchemaField) => {
    if (field.type !== 'select') {
      return null;
    }
    return (props: Omit<SelectProps, 'options'>) => (
      <Select {...props} options={field.options} />
    );
  },
  input: (field: SchemaField) => {
    if (field.type !== 'input') {
      return null;
    }
    return (props: InputProps) => (
      <Input {...props} placeholder={field.placeholder || '请输入'} />
    );
  },
  imageUpload: (field: SchemaField) => {
    if (field.type !== 'imageUpload') {
      return null;
    }
    return ImageUpload;
  },
  checkbox: (field: SchemaField) => {
    if (field.type !== 'checkbox') {
      return null;
    }
    return (props: CheckboxProps) => <Checkbox {...props} variant="primary" />;
  },
  textarea: (field: SchemaField) => {
    if (field.type !== 'textarea') {
      return null;
    }
    return (props: TextareaProps) => (
      <Textarea {...props} placeholder={field.placeholder || '请输入'} />
    );
  },

  constant: (_field: SchemaField) => null, // constant类型不渲染组件
} as const;
