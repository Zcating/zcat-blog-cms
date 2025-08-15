import {
  Button,
  Form,
  FormDialog,
  Row,
  useLoadingFn,
} from '@cms/components';
import type { Path } from 'react-hook-form';
import type {
  FieldsRecord,
  SchemeField,
  SchemeFieldsData,
} from './scheme-field';  
import zod from 'zod';
import { SCHEME_COMPONENT_MAP } from './scheme-component-map';
import type { zodResolver } from '@hookform/resolvers/zod';

interface SchemeFormProps<Fields extends FieldsRecord> {
  fields: Fields;
  schema?: Parameters<(typeof zodResolver)>[0];
  initialValues: SchemeFieldsData<Fields>;
  confirmText?: string;
  cancelText?: string;

  onSubmit: (data: SchemeFieldsData<Fields>) => Promise<void>;
  onCancel: () => void;
}

/**
 * 方案创建表单
 * @param {PhotoCreationFormProps} props
 * @returns {React.ReactElement}
 */
function SchemeForm<Fields extends FieldsRecord>(
  props: SchemeFormProps<Fields>,
): React.ReactElement {
  const entries = Object.entries(props.fields) as [
    Path<SchemeFieldsData<Fields>>,
    SchemeField,
  ][];

  const submit = useLoadingFn(props.onSubmit);

  const instance = Form.useForm<SchemeFieldsData<Fields>>({
    initialValues: props.initialValues,
    schema: props.schema,
    onSubmit: submit,
  });

  return (
    <Form form={instance} className="space-y-5">
      {entries.map(([key, field]) => {
        const componentRenderer = SCHEME_COMPONENT_MAP[field.type];
        if (!componentRenderer) { 
          return null;
        }
        
        const component = componentRenderer(field);
        if (!component) { 
          return null;
        }
        
        return (
          <Form.Item
            form={instance}
            label={field.label}
            name={key}
            key={key}
          >
            {component}
          </Form.Item>
        );
      })}
      <Row gap="5" justify="end">
        <Button variant="primary" type="submit" loading={submit.loading}>
          {props.confirmText || '创建'}
        </Button>
        <Button onClick={props.onCancel}>{props.cancelText || '取消'}</Button>
      </Row>
    </Form>
  );
}

interface UseSchemeFormParams<U, Fields extends FieldsRecord> {
  title: string;
  confirmText?: string;
  cancelText?: string;
  map: (data: U) => SchemeFieldsData<Fields>;
  onSubmit: (data: SchemeFieldsData<Fields>) => Promise<void>;
}

interface CreateSchemeFormParams<Fields extends FieldsRecord> {
  fields: Fields;
  schema?: Parameters<(typeof zodResolver)>[0];
}

export function createSchemeForm<Fields extends FieldsRecord>({
  fields,
  schema,
}: CreateSchemeFormParams<Fields>) {
  const showDialog = FormDialog.create<SchemeFieldsData<Fields>>((props) => {
    return (
      <SchemeForm
        {...props}
        fields={fields}
        schema={schema}
        initialValues={props.initialValues}
        confirmText={props.confirmText}
        cancelText={props.cancelText}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    );
  });

  return function useSchemeForm<U>(params: UseSchemeFormParams<U, Fields>) {
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
