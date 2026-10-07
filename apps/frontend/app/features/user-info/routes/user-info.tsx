/*
 * The page MUST read user data from the canonical
 * `userInfoQueryOptions()` cache (key `['users', 'current']`).
 * The `_cms` layout already seeds this cache during SSR; the
 * page is the reader, not the writer of the initial payload.
 *
 * The returned payload is written back into the cache under the same
 * key via `setQueryData` so the sidebar avatar (which also reads from
 * this query) refreshes synchronously without a refetch.
 */

import {
  Button,
  createZForm,
  ZImageUpload as ImageUpload,
  ZInput,
  ZTextarea as Textarea,
  Label,
  useWatch,
} from '@zcat/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { z } from 'zod';

import { updateCurrentUser, userInfoQueryOptions } from '@cms/server/users';
import { OssAction } from '@cms/core';
import { CmsAvatar } from '@cms/shared/ui';
import type {
  UpdateUserInfoBody,
  UserInfo as ServerUserInfo,
} from '@cms/server/users/users-helpers';

interface UserInfoValues extends ServerUserInfo {
  loading?: boolean;
}

/** 表单提交时 `avatar` 是三者之一：刚选中的 `blob:`、库里的对象 key，或 `''` 表示清除。 */
interface UserInfoUpdateValues extends UpdateUserInfoBody {
  avatar: string;
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

const EMPTY_USER: UserInfoValues = {
  name: '',
  contact: { email: '', github: '' },
  occupation: '',
  avatar: '',
  signedAvatar: '',
  aboutMe: '',
  abstract: '',
};

export default function UserInfo() {
  const queryClient = useQueryClient();
  const { data } = useQuery(userInfoQueryOptions());

  const userInfo: UserInfoValues = data ?? EMPTY_USER;

  const [editable, setEditable] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const mutation = useMutation<ServerUserInfo, Error, UserInfoUpdateValues>({
    mutationFn: async (values) => {
      // A staged file is still a local `blob:` URL here; the backend
      // stores `avatar` verbatim, so the picked bytes must be uploaded
      // first and replaced by its object key.
      const avatar = values.avatar.startsWith('blob:')
        ? await OssAction.uploadAvatar(values.avatar)
        : values.avatar;

      return updateCurrentUser({
        data: { ...values, avatar },
      }) as Promise<ServerUserInfo>;
    },
    onSuccess: (response) => {
      queryClient.setQueryData(userInfoQueryOptions().queryKey, response);
      setEditable(false);
      setErrorMessage(null);
    },
    onError: (error) => {
      // No automatic retry: surface the failure and clear the
      // pending overlay so the user can correct the form and
      // retry.
      setErrorMessage(error.message || '保存失败，请重试');
    },
  });

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
      setErrorMessage(null);
      mutation.mutate({
        name: values.name,
        contact: {
          email: values.contact.email,
          github: values.contact.github,
        },
        occupation: values.occupation,
        // The field is seeded from the stored key, so its three states are
        // already distinguishable: the bare key means untouched, a
        // `blob:` URL is uploaded by the mutation, and `''` clears the
        // avatar. A signed URL must never reach this payload.
        avatar: values.avatar,
        aboutMe: values.aboutMe,
        abstract: values.abstract,
      });
    },
  });

  // Reset the form values whenever the user re-enters edit mode.
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

  // A staged `blob:` file replaces the stored avatar while editing; any
  // other value (the stored key, or `''` once cleared) means the field
  // itself decides, so the stored signed URL stays on screen.
  const stagedAvatar = form.instance.watch('avatar');
  const currentAvatar = stagedAvatar.startsWith('blob:')
    ? stagedAvatar
    : userInfo.signedAvatar;

  // `onSuccess` leaves edit mode; keeping the form mounted here is what
  // makes the in-flight upload visible instead of a silent freeze.
  const submit = async () => {
    form.instance.handleSubmit(form.submit)();
  };

  const pending = mutation.isPending;

  return (
    <div className="w-full flex flex-col gap-6 pb-10 p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold">个人资料</div>
        <div className="flex gap-5">
          {editable ? (
            <React.Fragment>
              <Button variant="default" onClick={submit} disabled={pending}>
                保存
              </Button>
              <Button
                variant="destructive"
                onClick={() => setEditable(false)}
                disabled={pending}
              >
                取消
              </Button>
            </React.Fragment>
          ) : (
            <Button variant="default" onClick={() => setEditable(true)}>
              编辑
            </Button>
          )}
        </div>
      </div>
      {errorMessage ? (
        <div
          role="alert"
          data-testid="user-info-error"
          className="text-sm text-destructive"
        >
          {errorMessage}
        </div>
      ) : null}
      {editable ? (
        <UserInfoForm form={form} className="space-y-6 w-lg mb-20">
          <div className="flex items-center gap-6">
            <UserInfoForm.Item
              name="avatar"
              label="头像"
              description={
                pending ? '正在上传并保存…' : '重新选择可替换，清空可移除'
              }
            >
              <ImageUpload />
            </UserInfoForm.Item>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">当前头像</Label>
              <CmsAvatar src={currentAvatar} name={userInfo.name} />
            </div>
          </div>
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
        <div className="space-y-5 w-lg mb-40">
          <div className="flex flex-col gap-2">
            <Label className="text-muted-foreground">头像</Label>
            <CmsAvatar src={userInfo.signedAvatar} name={userInfo.name} />
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
        </div>
      )}
    </div>
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
