import type { SelectOption } from '@cms/components';

interface SelectSchemeField {
  label: string;
  options: SelectOption[];
  type: 'select';
  valueType: 'string';
}

interface InputSchemeField {
  label: string;
  placeholder?: string;
  type: 'input';
  valueType: 'string';
}

interface TextAreaSchemeField {
  label: string;
  placeholder?: string;
  type: 'textarea';
  valueType: 'string';
}

interface ImageUploadSchemeField {
  label: string;
  type: 'imageUpload';
  valueType: 'file';
}

interface CheckboxSchemeField {
  label: string;
  type: 'checkbox';
  valueType: 'boolean';
}

interface ConstantNumberField {
  label: string;
  type: 'constant';
  valueType: 'number';
}

interface ConstantStringField {
  label: string;
  type: 'constant';
  valueType: 'string';
}

export type SchemeField =
  | SelectSchemeField
  | InputSchemeField
  | TextAreaSchemeField
  | ImageUploadSchemeField
  | CheckboxSchemeField
  | ConstantNumberField
  | ConstantStringField;

export type FieldsRecord = Record<string, SchemeField>;

interface ValueMap {
  string: string;
  number: number;
  boolean: boolean;
  file: string | Blob | null;
}

export type SchemeFieldsData<Fields extends FieldsRecord> = {
  [Key in keyof Fields]: ValueMap[Fields[Key]['valueType']];
};

// export type SchemeSubmitData<Fields extends FieldsRecord> = {
//   [Key in keyof Fields]: ValueMap[Fields[Key]['valueType']];
// };

export function createSelect(
  label: string,
  options: SelectOption[],
): SelectSchemeField {
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
): InputSchemeField {
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
): TextAreaSchemeField {
  return {
    label,
    placeholder,
    type: 'textarea',
    valueType: 'string',
  };
}

export function createImageUpload(label: string): ImageUploadSchemeField {
  return {
    label,
    type: 'imageUpload',
    valueType: 'file',
  };
}

export function createCheckbox(label: string): CheckboxSchemeField {
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
