import {
  Button,
  createZForm,
  ZAvatar,
  ZImageUpload as ImageUpload,
  ZInput,
  Textarea,
  Label,
  useWatch,
} from '@zcat/ui';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import { UserApi } from '@cms/api';
import { safeObjectURL } from '@cms/components';
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

const UserInfoSchema = z.object({
  name: z.string().min(1, '用户名不能为空'),
  contact: z.object({
    email: z.email('请输入有效的邮箱地址'),
    github: z.string(),
  }),
  occupation: z.string(),
  avatar: z.string(),
  aboutMe: z.string(),
  abstract: z.string(),
});

const UserInfoForm = createZForm(UserInfoSchema);

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

  const form = UserInfoForm.useForm({
    defaultValues: {
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
    onSubmit: (values) => {
      React.startTransition(async () => {
        try {
          setOptimisticUserInfo(values);
          const res = await OssAction.updateUserInfo(values);
          commitUserInfo('update', res);
        } catch (error) {
          commitUserInfo('rollback');
        }
      });
    },
  });

  useWatch([editable], (_editable) => {
    if (!editable) {
      return;
    }
    form.instance.reset({
      name: userInfo.name,
      contact: {
        email: userInfo.contact.email,
        github: userInfo.contact.github,
      },
      occupation: userInfo.occupation,
      avatar: userInfo.avatar,
      aboutMe: userInfo.aboutMe,
      abstract: userInfo.abstract,
    });
  });

  const submit = async () => {
    setEditable(false);
    form.instance.handleSubmit(form.submit)();
  };

  return (
    <Workspace
      title="个人资料"
      operation={
        editable ? (
          <React.Fragment>
            <Button variant="default" onClick={submit}>
              保存
            </Button>
            <Button variant="destructive" onClick={() => setEditable(false)}>
              取消
            </Button>
          </React.Fragment>
        ) : (
          <Button variant="default" onClick={() => setEditable(true)}>
            编辑
          </Button>
        )
      }
    >
      {editable ? (
        <UserInfoForm form={form} className="space-y-6 w-lg mb-20">
          <UserInfoForm.Item name="avatar" label="头像">
            <ImageUpload />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="name" label="用户名">
            <ZInput />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="contact.email" label="Email">
            <ZInput />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="contact.github" label="Github">
            <ZInput />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="occupation" label="职业">
            <ZInput />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="abstract" label="一句话描述自己">
            <Textarea />
          </UserInfoForm.Item>
          <UserInfoForm.Item name="aboutMe" label="关于我">
            <Textarea />
          </UserInfoForm.Item>
        </UserInfoForm>
      ) : (
        <div className="space-y-5 w-lg mb-40 relative">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">头像</Label>
            <ZAvatar src={userInfo.avatar} alt={userInfo.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">用户名</Label>
            <TextField value={userInfo.name} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Email</Label>
            <TextField value={userInfo.contact.email} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">Github</Label>
            <TextField value={userInfo.contact.github} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">职业</Label>
            <TextField value={userInfo.occupation} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">一句话描述自己</Label>
            <TextField value={userInfo.abstract} />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">关于我</Label>
            <TextField value={userInfo.aboutMe} />
          </div>
          {userInfo.loading ? (
            <div className="absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center bg-white/50 z-10">
              <Loader2 className="animate-spin text-xl" />
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
