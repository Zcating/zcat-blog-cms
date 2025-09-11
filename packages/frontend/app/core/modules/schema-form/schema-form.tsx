import { Button, Form, FormDialog, Row, useLoadingFn } from '@cms/components';
import type { Path } from 'react-hook-form';
import type {
  FieldsRecord,
  SchemaField,
  SchemaFieldsData,
} from './schema-field';
// import zod from 'zod';
import { SCHEMA_COMPONENT_MAP } from './schema-component-map';

import type { zodResolver } from '@hookform/resolvers/zod';

interface SchemaFormProps<Fields extends FieldsRecord> {
  fields: Fields;
  schema?: Parameters<typeof zodResolver>[0];
  initialValues: SchemaFieldsData<Fields>;
  confirmText?: string;
  cancelText?: string;

  onSubmit: (data: SchemaFieldsData<Fields>) => Promise<void>;
  onCancel: () => void;
}

/**
 * 方案创建表单
 * @param {PhotoCreationFormProps} props
 * @returns {React.ReactElement}
 */
function SchemaForm<Fields extends FieldsRecord>(
  props: SchemaFormProps<Fields>,
): React.ReactElement {
  const entries = Object.entries(props.fields) as [
    Path<SchemaFieldsData<Fields>>,
    SchemaField,
  ][];

  const submit = useLoadingFn(props.onSubmit);

  const instance = Form.useForm<SchemaFieldsData<Fields>>({
    initialValues: props.initialValues,
    schema: props.schema,
    onSubmit: submit,
  });

  return (
    <Form form={instance} className="space-y-5">
      {entries.map(([key, field]) => {
        const componentRenderer = SCHEMA_COMPONENT_MAP[field.type];
        if (!componentRenderer) {
          return null;
        }

        const component = componentRenderer(field);
        if (!component) {
          return null;
        }

        return (
          <Form.Item form={instance} label={field.label} name={key} key={key}>
            {component}
          </Form.Item>
        );
      })}
      <Row gap="5" justify="end">
        <Button variant="primary" type="submit" loading={submit.loading}>
          {props.confirmText || '创建'}
        </Button>
        <Button onClick={props.onCancel} disabled={submit.loading}>
          {props.cancelText || '取消'}
        </Button>
      </Row>
    </Form>
  );
}

interface UseSchemaFormParams<U, Fields extends FieldsRecord> {
  title: string;
  confirmText?: string;
  cancelText?: string;
  map: (data: U) => SchemaFieldsData<Fields>;
  onSubmit: (data: SchemaFieldsData<Fields>) => Promise<void>;
}

interface CreateSchemaFormParams<Fields extends FieldsRecord> {
  fields: Fields;
  schema?: Parameters<typeof zodResolver>[0];
}

export function createSchemaForm<Fields extends FieldsRecord>(
  params: CreateSchemaFormParams<Fields>,
) {
  const showDialog = FormDialog.create<SchemaFieldsData<Fields>>((props) => {
    return (
      <SchemaForm
        {...props}
        fields={params.fields}
        schema={params.schema}
        initialValues={props.initialValues}
        confirmText={props.confirmText}
        cancelText={props.cancelText}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    );
  });

  return function useSchemaForm<U>(params: UseSchemaFormParams<U, Fields>) {
    return (data: U) =>
      showDialog({
        initialValues: params.map(data),
        title: params.title,
        confirmText: params.confirmText,
        cancelText: params.cancelText,
        onSubmit: params.onSubmit,
      });
  };
}
