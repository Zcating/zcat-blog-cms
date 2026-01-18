import { createZForm, ZButton, ZDialog } from '@zcat/ui';
import { isFunction } from '@zcat/ui/src/utils';

import { SCHEMA_COMPONENT_MAP } from './schema-component-map';

import type {
  SchemaField,
  SchemaFieldsData,
  SchemaFieldsRecord,
  SchemaFieldsZodValues,
} from './schema-field';
import type { Path } from 'react-hook-form';

/**
 * 基于Zod schema的表单组件 props
 */
interface SchemaFormProps<Fields extends SchemaFieldsRecord> {
  initialValues: SchemaFieldsData<Fields>;
  confirmText?: string;
  cancelText?: string;
  onSubmit: (data: SchemaFieldsData<Fields>) => Promise<void> | void;
  onCancel: () => void;
}
/**
 * 创建一个基于Zod schema的表单组件参数
 */
interface CreateSchemaFormParams<Fields extends SchemaFieldsRecord> {
  fields: Fields;
  schema: SchemaFieldsZodValues<Fields>;
}

interface UseFormDialogProps<Fields extends SchemaFieldsRecord> {
  title: string;
  confirmText?: string;
  cancelText?: string;
  onSubmit: (data: SchemaFieldsData<Fields>) => Promise<void> | void;
}

/**
 * 创建一个基于Zod schema的表单组件
 * @param params 创建参数
 * @returns 表单组件
 */
export function createSchemaForm<Fields extends SchemaFieldsRecord>(
  params: CreateSchemaFormParams<Fields>,
) {
  const SchemaForm = createZForm(params.schema);

  const entries = Object.entries(params.fields) as [
    Path<SchemaFieldsData<Fields>>,
    SchemaField,
  ][];

  const initialValues = params.schema.parse({});

  function SchemaFormComponent(props: SchemaFormProps<Fields>) {
    const {
      initialValues,
      confirmText = '确定',
      cancelText = '取消',
      onSubmit,
      onCancel,
    } = props;

    const form = SchemaForm.useForm({
      defaultValues: initialValues as any,
      onSubmit: onSubmit,
    });
    return (
      <SchemaForm form={form}>
        <div className="grid gap-4 py-4">
          {entries.map(([key, field]) => {
            const componentRenderer = SCHEMA_COMPONENT_MAP[field.type];
            if (!componentRenderer) {
              return null;
            }

            const Component = componentRenderer(field);
            if (!Component) {
              return null;
            }
            return (
              <SchemaForm.Item
                key={`form-${key as any}`}
                label={field.label}
                name={key as any}
                className="grid grid-cols-4 items-center gap-4"
              >
                <Component className="col-span-3" />
              </SchemaForm.Item>
            );
          })}
        </div>
        <div className="flex gap-5 justify-end">
          <ZButton variant="outline" type="button" onClick={onCancel}>
            {cancelText}
          </ZButton>
          <ZButton type="submit">{confirmText}</ZButton>
        </div>
      </SchemaForm>
    );
  }

  return function useFormDialog(props: UseFormDialogProps<Fields>) {
    const {
      title,
      confirmText = '确定',
      cancelText = '取消',
      onSubmit,
    } = props;

    return (values?: Partial<SchemaFieldsData<Fields>>) => {
      ZDialog.show({
        title,
        hideFooter: true,
        content: (props) => (
          <SchemaFormComponent
            confirmText={confirmText}
            cancelText={cancelText}
            initialValues={{ ...initialValues, ...values }}
            onSubmit={async (data) => {
              await onSubmit(data);
              props.onClose();
            }}
            onCancel={props.onClose}
          />
        ),
      });
    };
  };
}
