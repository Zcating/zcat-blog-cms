/**
 * Phase 3b user-info page.
 *
 * Behaviour preserved from the legacy implementation:
 *   - Reads the full `UserInfo` payload (display + edit modes).
 *   - Edits use the same zod-validated form fields and the same
 *     layout (avatar / name / contact / occupation / abstract /
 *     aboutMe).
 *   - Edit/Save/Cancel buttons, the pending overlay during save,
 *     and the reset-on-cancel behaviour all stay identical.
 *   - Avatar continues to flow through `safeObjectURL` so a
 *     `Blob` (upload preview) and a `string` (URL) are accepted.
 *
 * Migration contract (Phase 3b):
 *   - The page MUST read user data from the canonical
 *     `userInfoQueryOptions()` cache (key `['users', 'current']`).
 *     The `_cms` layout already seeds this cache during SSR; the
 *     page is the reader, not the writer of the initial payload.
 *   - The page MUST call the protected `updateCurrentUser` server
 *     function from `@cms/server/users` — not the legacy
 *     `OssAction.updateUserInfo` / `UserApi.updateUserInfo`
 *     surfaces. The returned payload is written back into the
 *     cache under the same key via `setQueryData` so the sidebar
 *     avatar (which also reads from this query) refreshes
 *     synchronously without a refetch.
 *   - No automatic retries: `retry: false` is configured in the
 *     per-request `QueryClient` factory (`makeQueryClient`).
 *   - Mutation failures surface a user-visible error message and
 *     clear the pending state without discarding the form so the
 *     user can retry.
 */

import {
  Button,
  createZForm,
  ZAvatar,
  ZImageUpload as ImageUpload,
  ZInput,
  ZTextarea as Textarea,
  Label,
  useWatch,
  safeObjectURL,
} from '@zcat/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { z } from 'zod';

import { updateCurrentUser, userInfoQueryOptions } from '@cms/server/users';
import type {
  UpdateUserInfoBody,
  UserInfo as ServerUserInfo,
} from '@cms/server/users/users-helpers';

interface UserInfoValues extends ServerUserInfo {
  loading?: boolean;
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
  aboutMe: '',
  abstract: '',
};

export default function UserInfo() {
  const queryClient = useQueryClient();
  const { data } = useQuery(userInfoQueryOptions());

  const userInfo: UserInfoValues = React.useMemo(() => {
    if (!data) {
      return EMPTY_USER;
    }
    return {
      ...data,
      avatar: safeObjectURL(data.avatar),
    };
  }, [data]);

  const [editable, setEditable] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const mutation = useMutation<ServerUserInfo, Error, UpdateUserInfoBody>({
    mutationFn: (values) =>
      updateCurrentUser({ data: values }) as Promise<ServerUserInfo>,
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

  const submit = async () => {
    setEditable(false);
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
          {pending ? (
            <div className="absolute top-0 left-0 bottom-0 right-0 flex items-center justify-center bg-white/50 z-10">
              <Loader2 className="animate-spin text-xl" />
            </div>
          ) : null}
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
