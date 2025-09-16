import { Outlet, redirect, useNavigate, useRouteError } from 'react-router';
import { isObject, Navbar, Sidebar } from '@cms/components';
import { isRouteErrorResponse } from 'react-router';
import React from 'react';
import {
  FormOutlined,
  PictureOutlined,
  PieChartOutlined,
  SettingOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons';

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  React.useEffect(() => {
    if (isObject(error) && error.message) {
      navigate('/login');
    }
  }, [error, navigate]);

  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>
          {error.status} {error.statusText}
        </h1>
        <p>{error.data}</p>
      </div>
    );
  } else {
    return <h1>未知错误</h1>;
  }
}

const menuItems = [
  {
    name: '仪表盘',
    icon: <PieChartOutlined style={{ color: 'oklch(0.45 0.15 45)' }} />,
    href: '/dashboard',
  },
  {
    name: '文章管理',
    icon: <FormOutlined style={{ color: 'oklch(0.42 0.12 35)' }} />,
    href: '/articles',
  },
  {
    name: '分类管理',
    icon: <TagsOutlined style={{ color: 'oklch(0.48 0.18 55)' }} />,
    href: '/article-categories',
  },
  {
    name: '相册管理',
    icon: <PictureOutlined style={{ color: 'oklch(0.46 0.14 65)' }} />,
    href: '/albums',
  },
  {
    name: '照片管理',
    icon: <PictureOutlined style={{ color: 'oklch(0.44 0.16 25)' }} />,
    href: '/photos',
  },
  {
    name: '用户信息',
    icon: <UserOutlined style={{ color: 'oklch(0.43 0.13 15)' }} />,
    href: '/user-info',
  },
  {
    name: '系统设置',
    icon: <SettingOutlined style={{ color: 'oklch(0.41 0.11 75)' }} />,
    href: '/settings',
  },
];

export default function CMSLayout() {
  return (
    <div className="h-screen bg-base-200">
      {/* 主内容区域 */}
      <div className="h-full flex flex-col">
        {/* 顶部导航栏 */}
        <Navbar />

        {/* 主内容 */}
        <div className="flex flex-1">
          <Sidebar className="w-40 h-full" items={menuItems} />
          <main className="flex-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-auto">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
