// import {
//   Button,
//   Form,
//   FormDialog,
//   ImageUpload,
//   Input,
//   Row,
//   Select,
//   type SelectOption,
// } from '@cms/components';
// import type { Path } from 'react-hook-form';

// interface SelectFormField {
//   label: string;
//   initialValue: string;
//   options: SelectOption[];
//   type: 'select';
// }

// interface InputFormField {
//   label: string;
//   initialValue: string;
//   type: 'input';
// }

// interface ImageUploadFormField {
//   label: string;
//   initialValue: File | null;
//   type: 'imageUpload';
// }

// type FormField = SelectFormField | InputFormField | ImageUploadFormField;

// type KeyOf<Fields> = Path<Record<keyof Fields, FormField['initialValue']>>;

// type DataOf<Fields> = Record<KeyOf<Fields>, FormField['initialValue']>;

// export function createSelect(
//   label: string,
//   initialValue: string,
//   options: SelectOption[],
// ): SelectFormField {
//   return {
//     label,
//     initialValue,
//     options,
//     type: 'select',
//   };
// }

// export function createInput(
//   label: string,
//   initialValue: string,
// ): InputFormField {
//   return {
//     label,
//     initialValue,
//     type: 'input',
//   };
// }

// export function createImageUpload(
//   label: string,
//   initialValue: File | null,
// ): ImageUploadFormField {
//   return {
//     label,
//     initialValue,
//     type: 'imageUpload',
//   };
// }

// interface SchemeFormProps<Fields extends Record<string, FormField>> {
//   imageUrl?: string;
//   fields: Fields;
//   onSubmit: (data: DataOf<Fields>) => Promise<void>;
//   onCancel: () => void;
// }

// /**
//  * 方案创建表单
//  * @param {PhotoCreationFormProps} props
//  * @returns {React.ReactElement}
//  */
// function SchemeForm<Fields extends Record<string, FormField>>(
//   props: SchemeFormProps<Fields>,
// ): React.ReactElement {
//   const entries = Object.entries(props.fields) as [
//     Path<DataOf<Fields>>,
//     FormField,
//   ][];
//   const instance = Form.useForm({
//     initialValues: Object.fromEntries(
//       entries.map(([key, field]) => [key, field.initialValue]),
//     ) as DataOf<Fields>,
//     onSubmit: props.onSubmit,
//   });

//   return (
//     <Form form={instance} className="space-y-5">
//       {entries.map(([key, field]) => {
//         switch (field.type) {
//           case 'select':
//             return (
//               <Form.Item form={instance} label={field.label} name={key}>
//                 <Select options={field.options} />
//               </Form.Item>
//             );
//           case 'input':
//             return (
//               <Form.Item form={instance} label={field.label} name={key}>
//                 <Input />
//               </Form.Item>
//             );
//           case 'imageUpload':
//             return (
//               <Form.Item form={instance} label={field.label} name={key}>
//                 <ImageUpload imageUrl={props.imageUrl} />
//               </Form.Item>
//             );
//         }
//       })}
//       <Row gap="3" justify="end">
//         <Button variant="primary" type="submit">
//           创建
//         </Button>
//         <Button onClick={props.onCancel}>取消</Button>
//       </Row>
//     </Form>
//   );
// }

// function Adaptor<Fields extends Record<string, FormField>>(
//   props: SchemeFormProps<Fields>,
// ): FormDialog.FormComponentProps<DataOf<Fields>> {
//   return {
//     ...props,
//     fields: Object.fromEntries(
//       Object.entries(props.fields).map(([key, field]) => [
//         key as Path<DataOf<Fields>>,
//         field,
//       ]),
//     ),
//   };
// }

// function createSchemeForm<Fields extends Record<string, FormField>>(
//   props: SchemeFormProps<Fields>,
// ) {
//   FormDialog.create<any>((props) => SchemeForm());
// }
