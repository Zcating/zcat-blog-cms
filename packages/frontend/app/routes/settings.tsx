import { SystemSettingApi } from '@cms/api';
import { Button, Form, Input } from '@cms/components';
import type { Route } from './+types/settings';

export function clientLoader() {
  // return SystemSettingApi.getSystemSetting();
}

export default function Settings(props: Route.ComponentProps) {
  // const form = Form.useForm({
  //   initialValues: {
  //     accessKey: props.loaderData.ossConfig.accessKey,
  //     secretKey: props.loaderData.ossConfig.secretKey,
  //   },
  //   onSubmit: async (values) => {
  //     await SystemSettingApi.updateSystemSetting({
  //       ossConfig: {
  //         accessKey: values.accessKey,
  //         secretKey: values.secretKey,
  //       },
  //     });
  //   },
  // });
  // return (
  //   <div>
  //     <Form form={form}>
  //       <Form.Item form={form} name="accessKey" label="Access Key">
  //         <Input />
  //       </Form.Item>
  //       <Form.Item form={form} name="secretKey" label="Secret Key">
  //         <Input />
  //       </Form.Item>
  //       <Button type="submit">提交</Button>
  //     </Form>
  //   </div>
  // );
}
