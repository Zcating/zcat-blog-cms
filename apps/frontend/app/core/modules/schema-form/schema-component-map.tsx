import { ZCheckbox, ZInput, ZSelect, Textarea } from '@zcat/ui';

import { ImageUpload } from '@cms/components';

import type { SchemaField } from './schema-field';

const ZTextarea = ({ onValueChange, ...props }: any) => <Textarea {...props} />;

export const SCHEMA_COMPONENT_MAP = {
  select: (field: SchemaField) => {
    if (field.type !== 'select') {
      return null;
    }
    return (props: any) => <ZSelect {...props} options={field.options} />;
  },
  input: (field: SchemaField) => {
    if (field.type !== 'input') {
      return null;
    }
    return (props: any) => (
      <ZInput {...props} placeholder={field.placeholder || '请输入'} />
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
    return (props: any) => <ZCheckbox {...props} />;
  },
  textarea: (field: SchemaField) => {
    if (field.type !== 'textarea') {
      return null;
    }
    return (props: any) => (
      <ZTextarea {...props} placeholder={field.placeholder || '请输入'} />
    );
  },

  constant: (_field: SchemaField) => null, // constant类型不渲染组件
} as const;
