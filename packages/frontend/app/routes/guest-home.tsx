import { useState, type FormEvent } from 'react';
import type { Route } from './+types/guest-home';

import { AuthApi } from '@cms/api';
import { Button, useLoadingFn } from '@cms/components';
import { useNavigate } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: '登录 - Blog CMS' },
    { name: 'description', content: '登录到博客内容管理系统' },
  ];
}

export default function GuestHome() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  });

  // const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const navigate = useNavigate();
  const handleSubmit = useLoadingFn(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      await AuthApi.login(formData);
      navigate('/dashboard');
    },
  );

  const isLoading = handleSubmit.loading;

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          {/* 头部 */}
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">欢迎回来</h1>
            <p className="text-base-content/70">登录到你的博客管理系统</p>
          </div>

          {/* 登录表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 用户名输入 */}
            <div className="form-control">
              <label className="label">
                <span className="label-text">用户名</span>
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="请输入用户名"
                className="input w-full"
                required
              />
            </div>

            {/* 密码输入 */}
            <div>
              <label className="label">
                <span className="label-text">密码</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="请输入密码"
                className="input w-full"
                required
              />
            </div>

            {/* 记住我和忘记密码 */}
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-3">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="checkbox checkbox-primary"
                />
                <span className="label-text">记住我</span>
              </label>
            </div>

            {/* 登录按钮 */}
            <div className="form-control mt-6">
              <Button variant="primary" shape="block" disabled={isLoading}>
                {isLoading ? '登录中...' : '登录'}
              </Button>
            </div>

            {/* 忘记密码链接 */}
            <div className="text-center">
              <a href="#" className="link link-primary text-sm">
                忘记密码？
              </a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
