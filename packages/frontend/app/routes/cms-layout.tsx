import { Outlet, useLocation, useNavigate, useRouteError } from 'react-router';
import { Navbar, Sidebar } from '@cms/components';
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
  const [message, setMessage] = React.useState('');

  React.useEffect(() => {
    if (isRouteErrorResponse(error)) {
      setMessage(`状态码：${error.status} \n 错误内容: ${error.statusText}`);
    }
    if (error instanceof Error) {
      if (error.message === 'Unauthorized') {
        navigate('/login');
      } else {
        setMessage(error.message);
      }
    } else {
      setMessage('未知错误');
    }
  }, [error]);

  return (
    <Layout>
      <div>{message}</div>
    </Layout>
  );
}

export default function CMSLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
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
  // {
  //   name: '分类管理',
  //   icon: <TagsOutlined style={{ color: 'oklch(0.48 0.18 55)' }} />,
  //   href: '/article-categories',
  // },
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

interface LayoutProps {
  children: React.ReactNode;
}

function Layout(props: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-base-200">
      {/* 主内容区域 */}
      <div className="h-full flex flex-col">
        {/* 顶部导航栏 */}
        <Navbar />

        {/* 主内容 */}
        <div className="flex flex-1">
          <Sidebar
            className="w-40 h-full"
            items={menuItems}
            isSelected={(item) => location.pathname.startsWith(item.href)}
            onClickItem={(item) => {
              navigate(item.href);
            }}
          />
          <main className="flex-1 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 bottom-0 overflow-auto p-6">
              {props.children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
