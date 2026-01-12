import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';

import { UserApi } from '@cms/api';
import {
  Avatar,
  Button,
  Form,
  ImageUpload,
  Input,
  safeObjectURL,
  Textarea,
} from '@cms/components';
import { Label } from '@cms/components/ui/label';
import { OssAction, UseOptimisticObject, Workspace } from '@cms/core';

import type { Route } from './+types/user-info';

interface UserInfoValues extends UserApi.UserInfo {
  loading?: boolean;
}

export async function clientLoader() {
  return {
    userInfo: (await UserApi.userInfo()) as UserInfoValues,
  };
}

export default function UserInfo(props: Route.ComponentProps) {
  const [userInfo, setOptimisticUserInfo, commitUserInfo] = UseOptimisticObject(
    props.loaderData.userInfo,
    (prev, data: UserInfoValues) => {
      return {
        ...prev,
        avatar: safeObjectURL(data.avatar),
        loading: true,
      };
    },
  );

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
      React.startTransition(async () => {
        try {
          setOptimisticUserInfo(values);
          const res = await OssAction.updateUserInfo(values);
          console.log('updateUserInfo', values, res);
          commitUserInfo('update', res);
        } catch (error) {
          console.error(error);
          commitUserInfo('rollback');
        }
      });
    },
  });

  React.useEffect(() => {
    const { unsubscribe } = form.watch((value) => {
      console.log(value);
    });
    return () => unsubscribe();
  }, [form.watch]);

  const submit = async () => {
    setEditable(false);
    form.submit();
  };

  return (
    <Workspace
      title="个人资料"
      operation={
        editable ? (
          <React.Fragment>
            <Button variant="accent" onClick={submit}>
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
        <div className="space-y-5 w-lg mb-40 relative">
          <Label label="头像">
            <Avatar src={userInfo.avatar} />
          </Label>
          <Label label="用户名">
            <TextField value={userInfo.name} />
          </Label>
          <Label label="Email">
            <TextField value={userInfo.contact.email} />
          </Label>
          <Label label="Github">
            <TextField value={userInfo.contact.github} />
          </Label>
          <Label label="职业">
            <TextField value={userInfo.occupation} />
          </Label>
          <Label label="一句话描述自己">
            <TextField value={userInfo.abstract} />
          </Label>
          <Label label="关于我">
            <TextField value={userInfo.aboutMe} />
          </Label>
          {userInfo.loading ? (
            <div className="absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center">
              <LoadingOutlined className="text-xl" />
            </div>
          ) : null}
        </div>
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
