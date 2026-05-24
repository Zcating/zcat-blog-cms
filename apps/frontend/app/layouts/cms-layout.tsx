import {
  Separator,
  SidebarTrigger,
  ZDialog,
  ZSidebar,
  ZStickyHeader,
  ZView,
  type ZSidebarOption,
} from '@zcat/ui';
import {
  BookImageIcon,
  Gauge,
  ImageIcon,
  LogOut,
  NotebookIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import React from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
  useLocation,
} from 'react-router';

import { AuthApi } from '@cms/api';

const FRONTEND_VERSION = '1.0.0';

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
  }, [navigate, error]);

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

const menuItems: ZSidebarOption[] = [
  {
    label: '仪表盘',
    value: '/dashboard',
    icon: Gauge,
  },
  {
    label: '文章管理',
    value: '/articles',
    icon: NotebookIcon,
  },
  // {
  //   label: '分类管理',
  //   value: '/article-categories',
  //   icon: (props: any) => <TagsOutlined {...props} style={{ ...props.style, color: 'oklch(0.48 0.18 55)' }} />,
  // },
  {
    label: '相册管理',
    value: '/albums',
    icon: BookImageIcon,
  },
  {
    label: '照片管理',
    value: '/photos',
    icon: ImageIcon,
  },
  {
    label: '用户信息',
    value: '/user-info',
    icon: UserIcon,
  },
  {
    label: '系统设置',
    value: '/settings',
    icon: SettingsIcon,
  },
];

function isActive(value: string | undefined, activeValue: string | undefined) {
  return !!activeValue?.startsWith(value ?? '');
}

interface LayoutProps {
  children: React.ReactNode;
}

function Layout(props: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const confirmed = await ZDialog.confirm({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '退出',
      cancelText: '取消',
    });
    if (!confirmed) return;

    await AuthApi.logout();
    navigate('/login');
  };

  const renderItem = (item: ZSidebarOption) => {
    if (!item.value) {
      return (
        <ZView className="flex items-center gap-3">
          {item.icon && <item.icon className="size-4" />}
          <span>{item.label}</span>
        </ZView>
      );
    }
    return (
      <Link to={item.value} className="flex items-center gap-3 h-12">
        {item.icon ? (
          <item.icon className="size-6" />
        ) : (
          <ZView className="size-6" />
        )}
        <span className="text-[16px]">{item.label}</span>
      </Link>
    );
  };

  return (
    <ZSidebar
      header={
        <ZStickyHeader className="items-center">
          <SidebarTrigger className="mx-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="ml-10 font-medium">ZCAT CMS</div>
        </ZStickyHeader>
      }
      options={menuItems}
      renderItem={renderItem}
      currentValue={location.pathname}
      isActive={isActive}
      sidebarFooter={
        <div className="flex flex-col">
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 h-12 px-4 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors cursor-pointer text-left"
          >
            <LogOut className="size-5" />
            <span>退出登录</span>
          </button>
          {/* <Separator className="my-1" />
          <div className="text-xs text-muted-foreground text-center py-2">
            v{FRONTEND_VERSION}
          </div> */}
        </div>
      }
    >
      <ZView className="w-full h-full flex flex-col relative overflow-hidden">
        <ZView
          id="cms-layout-content"
          className="absolute top-0 left-0 bottom-0 right-0 overflow-auto"
        >
          {props.children}
        </ZView>
      </ZView>
    </ZSidebar>
  );
}
