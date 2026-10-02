import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  createZForm,
  ZButton,
  ZInput,
  StaggerReveal,
  ZNotification,
} from '@zcat/ui';
import { useServerFn } from '@tanstack/react-start';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { clearPrivateQueryCache } from '@cms/shared/query';
import { login } from '@cms/server/auth';

export function meta() {
  return [
    { title: '登录 ZCAT-BLOG-CMS' },
    { name: 'description', content: '登录到博客内容管理系统' },
  ];
}

const LoginForm = createZForm({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码'),
});

export default function GuestHome() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // `useServerFn` is the path that survives the React Query SSR
  // integration without dropping the Set-Cookie response before the
  // next navigation.
  const submitLogin = useServerFn(login);

  const form = LoginForm.useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: async (data) => {
      try {
        await submitLogin({
          data: { username: data.username, password: data.password },
        });
        await ZNotification.success('登录成功');
        // A new identity is a session change, and this navigation is
        // an SPA transition: the browser QueryClient is not rebuilt.
        // Every private loader uses `staleTime: 'static'`, so without
        // this wipe the new account renders the previous account's
        // `['statistics','*']`, `['articles','list']` and friends.
        // Same helper the logout handler, the `_cms` guard and the
        // cache `onError` hooks use.
        clearPrivateQueryCache(queryClient);
        await navigate({ to: '/dashboard' });
      } catch (error) {
        await ZNotification.error(
          error instanceof Error ? error.message : '登录失败',
        );
      }
    },
  });

  return (
    <StaggerReveal
      selector='[login-form="true"]'
      direction="top"
      className="min-h-screen bg-base-200 flex items-center justify-center p-4"
    >
      <Card
        login-form="true"
        className="w-full max-w-md shadow-xl bg-base-100 border-none"
      >
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-3xl font-bold text-primary mb-2">
            ZCAT-BLOG-CMS
          </CardTitle>
          <CardDescription className="text-base-content/70">
            欢迎回来，请登录
          </CardDescription>
        </CardHeader>

        <CardContent>
          <LoginForm form={form} className="space-y-4">
            <LoginForm.Item name="username" label="用户名">
              <ZInput placeholder="请输入用户名" />
            </LoginForm.Item>

            <LoginForm.Item name="password" label="密码">
              <ZInput type="password" placeholder="请输入密码" />
            </LoginForm.Item>

            <div className="form-control mt-6">
              <ZButton className="w-full" type="submit">
                登录
              </ZButton>
            </div>
          </LoginForm>
        </CardContent>
      </Card>
    </StaggerReveal>
  );
}
