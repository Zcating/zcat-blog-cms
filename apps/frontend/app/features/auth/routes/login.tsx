import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  createZForm,
  ZButton,
  ZInput,
  ZCheckbox,
  StaggerReveal,
} from '@zcat/ui';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { AuthApi } from '@cms/api';

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

  const form = LoginForm.useForm({
    defaultValues: {
      username: '',
      password: '',
    },
    onSubmit: async (data) => {
      await AuthApi.login(data);
      await navigate('/dashboard');
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

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <ZCheckbox />
                <span className="label-text">记住我</span>
              </label>
            </div>

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
