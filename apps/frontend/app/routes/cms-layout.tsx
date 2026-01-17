import {
  Separator,
  SidebarTrigger,
  ZSidebar,
  ZView,
  type ZSidebarOption,
} from '@zcat/ui';
import {
  BookImageIcon,
  Gauge,
  ImageIcon,
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-medium">ZCAT CMS</div>
        </header>
      }
      options={menuItems}
      renderItem={renderItem}
      activeValue={location.pathname}
      isActive={isActive}
    >
      <div className="flex flex-1 flex-col gap-4 p-4">{props.children}</div>
    </ZSidebar>
  );
}
