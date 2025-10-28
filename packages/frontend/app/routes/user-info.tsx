import { UserApi } from '@cms/api';
import type { Route } from './+types/user-info';
import {
  Avatar,
  Button,
  Form,
  ImageUpload,
  Input,
  Textarea,
  useLoadingFn,
} from '@cms/components';
import { OssAction, Workspace } from '@cms/core';
import React from 'react';

export async function clientLoader() {
  return {
    userInfo: await UserApi.userInfo(),
  };
}

export default function UserInfo(props: Route.ComponentProps) {
  const { userInfo } = props.loaderData;

  const [editable, setEditable] = React.useState(false);

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

  const submit = useLoadingFn(async () => {
    await form.submit();
    setEditable(false);
  });

  return (
    <Workspace
      title="个人资料"
      operation={
        editable ? (
          <React.Fragment>
            <Button variant="accent" onClick={submit} loading={submit.loading}>
              保存
            </Button>
            <Button variant="error" onClick={() => setEditable(false)}>
              取消
            </Button>
          </React.Fragment>
        ) : (
          <Button variant="primary" onClick={() => setEditable(true)}>
            编辑
          </Button>
        )
      }
    >
      {editable ? (
        <Form form={form} className="space-y-5 w-lg mb-20">
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
        </Form>
      ) : (
        <Form form={form} className="space-y-5 w-lg mb-40">
          <Form.Item form={form} name="avatar" label="头像">
            <ImageField />
          </Form.Item>
          <Form.Item form={form} name="name" label="用户名">
            <TextField />
          </Form.Item>
          <Form.Item form={form} name="contact.email" label="Email">
            <TextField />
          </Form.Item>
          <Form.Item form={form} name="contact.github" label="Github">
            <TextField />
          </Form.Item>
          <Form.Item form={form} name="occupation" label="职业">
            <TextField />
          </Form.Item>
          <Form.Item form={form} name="abstract" label="一句话描述自己">
            <TextField />
          </Form.Item>
          <Form.Item form={form} name="aboutMe" label="关于我">
            <TextField />
          </Form.Item>
        </Form>
      )}
    </Workspace>
  );
}

interface TextFieldProps {
  value?: string;
}

function TextField(props: TextFieldProps) {
  return (
    <p className="border-b border-solid px-2 py-2 w-full min-h-10 break-all text-sm">
      {props.value}
    </p>
  );
}

function ImageField(props: TextFieldProps) {
  return <Avatar src={props.value} />;
}
