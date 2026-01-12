import { useForm } from '@tanstack/react-form';

import { Button, Form, FormDialog, Row, Label } from '@cms/components';

import { SCHEMA_COMPONENT_MAP } from './schema-component-map';

// import zod from 'zod';

import type { FieldsRecord, SchemaFieldsData } from './schema-field';
import type { zodResolver } from '@hookform/resolvers/zod';

interface SchemaFormProps<Fields extends FieldsRecord> {
  fields: Fields;
  schema?: Parameters<typeof zodResolver>[0];
  initialValues: SchemaFieldsData<Fields>;
  confirmText?: string;
  cancelText?: string;

  onSubmit: (data: SchemaFieldsData<Fields>) => void;
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
  const entries = Object.entries(props.fields);

  const form = useForm({
    defaultValues: props.initialValues,
    onSubmit: ({ value }) => {
      props.onSubmit(value);
    },
  });

  return (
    <Form form={form}>
      {entries.map(([key, field]) => {
        const componentRenderer = SCHEMA_COMPONENT_MAP[field.type];
        if (!componentRenderer) {
          return null;
        }

        const Component = componentRenderer(field);
        if (!Component) {
          return null;
        }

        const label = field.label;
        return (
          <form.Field
            name={key}
            key={`form-${key}`}
            children={(field) => (
              <Label label={label} span={3}>
                <Component
                  value={field.state.value}
                  onChange={field.handleChange}
                  onBlur={field.handleBlur}
                />
              </Label>
            )}
          />
        );
      })}
      <Row gap="5" justify="end">
        <Button variant="primary" type="submit">
          {props.confirmText || '创建'}
        </Button>
        <Button onClick={props.onCancel}>{props.cancelText || '取消'}</Button>
      </Row>
    </Form>
  );
}

interface UseSchemaFormParams<U, Fields extends FieldsRecord> {
  title: string;
  confirmText?: string;
  cancelText?: string;
  map: (data: U) => SchemaFieldsData<Fields>;
  onSubmit: (data: SchemaFieldsData<Fields>) => Promise<void> | void;
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
