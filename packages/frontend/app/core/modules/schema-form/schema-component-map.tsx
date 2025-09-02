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
    if (field.type === 'select') {
      return <Select options={field.options} />;
    }
    return null;
  },
  input: (field: SchemaField) => {
    if (field.type === 'input') {
      return <Input placeholder={field.placeholder || '请输入'} />;
    }
    return null;
  },
  imageUpload: () => <ImageUpload />,
  checkbox: () => <Checkbox variant="primary" />,
  textarea: (field: SchemaField) => {
    if (field.type === 'textarea') {
      return <Textarea placeholder={field.placeholder || '请输入'} />;
    }
    return null;
  },
  constant: () => null, // constant类型不渲染组件
} as const;
