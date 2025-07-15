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
} from '@cms/components';
import type { Path } from 'react-hook-form';
import type {
  FieldsRecord,
  SchemeField,
  SchemeFieldsData,
} from './create-scheme-field';

interface SchemeFormProps<Fields extends FieldsRecord> {
  fields: Fields;
  initialValues: SchemeFieldsData<Fields>;
  onSubmit: (data: SchemeFieldsData<Fields>) => void;
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
  const instance = Form.useForm({
    initialValues: props.initialValues,
    onSubmit: props.onSubmit,
  });

  return (
    <Form form={instance} className="space-y-5">
      {entries.map(([key, field]) => {
        switch (field.type) {
          case 'select':
            return (
              <Form.Item form={instance} label={field.label} name={key}>
                <Select options={field.options} />
              </Form.Item>
            );
          case 'input':
            return (
              <Form.Item form={instance} label={field.label} name={key}>
                <Input placeholder={field.placeholder || '请输入'} />
              </Form.Item>
            );
          case 'imageUpload':
            return (
              <Form.Item form={instance} label={field.label} name={key}>
                <ImageUpload />
              </Form.Item>
            );
          case 'checkbox':
            return (
              <Form.Item form={instance} label={field.label} name={key}>
                <Checkbox variant="primary" />
              </Form.Item>
            );
          case 'textarea':
            return (
              <Form.Item form={instance} label={field.label} name={key}>
                <Textarea placeholder={field.placeholder || '请输入'} />
              </Form.Item>
            );
        }
      })}
      <Row gap="3" justify="end">
        <Button onClick={props.onCancel}>取消</Button>
        <Button variant="primary" type="submit">
          创建
        </Button>
      </Row>
    </Form>
  );
}

export function createSchemeForm<Fields extends FieldsRecord>(fields: Fields) {
  return FormDialog.create<SchemeFieldsData<Fields>>((props) => {
    return (
      <SchemeForm
        {...props}
        fields={fields}
        initialValues={props.initialValues}
        onSubmit={props.onSubmit}
        onCancel={props.onCancel}
      />
    );
  });
}
