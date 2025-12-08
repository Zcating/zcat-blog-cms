import {
  Checkbox,
  ImageUpload,
  Input,
  Select,
  Textarea,
} from '@cms/components';

import type { SchemaField } from './schema-field';

export const SCHEMA_COMPONENT_MAP = {
  select: (field: SchemaField) => {
    if (field.type !== 'select') {
      return null;
    }
    return <Select options={field.options} />;
  },
  input: (field: SchemaField) => {
    if (field.type !== 'input') {
      return null;
    }
    return <Input placeholder={field.placeholder || '请输入'} />;
  },
  imageUpload: (field: SchemaField) => {
    if (field.type !== 'imageUpload') {
      return null;
    }
    return <ImageUpload />;
  },
  checkbox: (field: SchemaField) => {
    if (field.type !== 'checkbox') {
      return null;
    }
    return <Checkbox variant="primary" />;
  },
  textarea: (field: SchemaField) => {
    if (field.type !== 'textarea') {
      return null;
    }
    return <Textarea placeholder={field.placeholder || '请输入'} />;
  },
  constant: (field: SchemaField) => null, // constant类型不渲染组件
} as const;
