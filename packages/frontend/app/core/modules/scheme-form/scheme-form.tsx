import {
  Button,
  Checkbox,
  Form,
  FormDialog,
  ImageUpload,
  Input,
  Row,
  Select,
  Textarea,
  useLoadingFn,
} from '@cms/components';
import type { Path } from 'react-hook-form';
import type {
  FieldsRecord,
  SchemeField,
  SchemeFieldsData,
} from './scheme-field';

interface SchemeFormProps<Fields extends FieldsRecord> {
  fields: Fields;
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

  const instance = Form.useForm({
    initialValues: props.initialValues,
    onSubmit: submit,
  });

  return (
    <Form form={instance} className="space-y-5">
      {entries.map(([key, field]) => {
        switch (field.type) {
          case 'select':
            return (
              <Form.Item
                form={instance}
                label={field.label}
                name={key}
                key={key}
              >
                <Select options={field.options} />
              </Form.Item>
            );
          case 'input':
            return (
              <Form.Item
                form={instance}
                label={field.label}
                name={key}
                key={key}
              >
                <Input placeholder={field.placeholder || '请输入'} />
              </Form.Item>
            );
          case 'imageUpload':
            return (
              <Form.Item
                form={instance}
                label={field.label}
                name={key}
                key={key}
              >
                <ImageUpload />
              </Form.Item>
            );
          case 'checkbox':
            return (
              <Form.Item
                form={instance}
                label={field.label}
                name={key}
                key={key}
              >
                <Checkbox variant="primary" />
              </Form.Item>
            );
          case 'textarea':
            return (
              <Form.Item
                form={instance}
                label={field.label}
                name={key}
                key={key}
              >
                <Textarea placeholder={field.placeholder || '请输入'} />
              </Form.Item>
            );
        }
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

export function createSchemeForm<Fields extends FieldsRecord>(fields: Fields) {
  const showDialog = FormDialog.create<SchemeFieldsData<Fields>>((props) => {
    return (
      <SchemeForm
        {...props}
        fields={fields}
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
