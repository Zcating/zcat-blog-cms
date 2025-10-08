import { UserApi } from '@cms/api';
import type { Route } from './+types/user-info';
import { Button, Form, ImageUpload, Input, Textarea } from '@cms/components';
import { OssAction, Workspace } from '@cms/core';

export async function clientLoader() {
  return {
    userInfo: await UserApi.userInfo(),
  };
}

export default function UserInfo(props: Route.ComponentProps) {
  const { userInfo } = props.loaderData;

  const form = Form.useForm({
    initialValues: {
      id: userInfo.id,
      name: userInfo.name,
      contact: {
        email: userInfo.contact.email,
        github: userInfo.contact.github,
      },
      occupation: userInfo.occupation,
      avatar: userInfo.avatar,
      aboutMe: userInfo.aboutMe,
      abstract: userInfo.abstract,
    },
    async onSubmit(values) {
      await OssAction.updateUserInfo(values);
    },
  });

  return (
    <Workspace title="个人资料">
      <Form form={form} className="space-y-5">
        <Form.Item form={form} name="avatar" label="头像">
          <ImageUpload />
        </Form.Item>
        <Form.Item form={form} name="name" label="用户名">
          <Input />
        </Form.Item>
        <Form.Item form={form} name="contact.email" label="Email">
          <Input />
        </Form.Item>
        <Form.Item form={form} name="contact.github" label="Github">
          <Input />
        </Form.Item>
        <Form.Item form={form} name="occupation" label="职业">
          <Input />
        </Form.Item>
        <Form.Item form={form} name="abstract" label="一句话描述自己">
          <Textarea />
        </Form.Item>
        <Form.Item form={form} name="aboutMe" label="关于我">
          <Textarea />
        </Form.Item>

        <Button variant="primary" type="submit">
          提交
        </Button>
      </Form>
    </Workspace>
  );
}
