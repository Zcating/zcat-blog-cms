import type { SelectOption } from '@cms/components';

interface SelectSchemaField {
  label: string;
  options: SelectOption[];
  type: 'select';
  valueType: 'string';
}

interface InputSchemaField {
  label: string;
  placeholder?: string;
  type: 'input';
  valueType: 'string';
}

interface TextAreaSchemaField {
  label: string;
  placeholder?: string;
  type: 'textarea';
  valueType: 'string';
}

interface ImageUploadSchemaField {
  label: string;
  type: 'imageUpload';
  valueType: 'file';
}

interface CheckboxSchemaField {
  label: string;
  type: 'checkbox';
  valueType: 'boolean';
}

export interface ConstantNumberField {
  label: string;
  type: 'constant';
  valueType: 'number';
}

interface ConstantStringField {
  label: string;
  type: 'constant';
  valueType: 'string';
}

export type SchemaField =
  | SelectSchemaField
  | InputSchemaField
  | TextAreaSchemaField
  | ImageUploadSchemaField
  | CheckboxSchemaField
  | ConstantNumberField
  | ConstantStringField;

export type FieldsRecord = Record<string, SchemaField>;

interface ValueMap {
  string: string;
  number: number;
  boolean: boolean;
  file: string | Blob | null;
}

export type SchemaFieldsData<Fields extends FieldsRecord> = {
  [Key in keyof Fields]: ValueMap[Fields[Key]['valueType']];
};

// export type SchemaSubmitData<Fields extends FieldsRecord> = {
//   [Key in keyof Fields]: ValueMap[Fields[Key]['valueType']];
// };

export function createSelect(
  label: string,
  options: SelectOption[],
): SelectSchemaField {
  return {
    label,
    options,
    type: 'select',
    valueType: 'string',
  };
}

export function createInput(
  label: string,
  placeholder?: string,
): InputSchemaField {
  return {
    label,
    placeholder,
    type: 'input',
    valueType: 'string',
  };
}

export function createTextArea(
  label: string,
  placeholder?: string,
): TextAreaSchemaField {
  return {
    label,
    placeholder,
    type: 'textarea',
    valueType: 'string',
  };
}

export function createImageUpload(label: string): ImageUploadSchemaField {
  return {
    label,
    type: 'imageUpload',
    valueType: 'file',
  };
}

export function createCheckbox(label: string): CheckboxSchemaField {
  return {
    label,
    type: 'checkbox',
    valueType: 'boolean',
  };
}

export function createConstNumber(): ConstantNumberField {
  return {
    label: '',
    type: 'constant',
    valueType: 'number',
  };
}

export function createConstString(): ConstantStringField {
  return {
    label: '',
    type: 'constant',
    valueType: 'string',
  };
}
