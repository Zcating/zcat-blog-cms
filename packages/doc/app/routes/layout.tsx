import {
  Separator,
  SidebarTrigger,
  ZSidebar,
  ZView,
  type ZSidebarOption,
} from '@zcat/ui';
import {
  Component as ComponentIcon,
  Bird as BirdIcon,
  FormInputIcon,
  LayoutDashboard,
  CircleAlertIcon,
  MenuSquareIcon,
  NavigationIcon,
} from 'lucide-react';
import { Link, Outlet } from 'react-router';

const sidebarOptions: ZSidebarOption[] = [
  {
    label: '通用',
    icon: ComponentIcon,
    children: [
      {
        label: '按钮',
        value: 'button',
      },
      {
        label: '视图',
        value: 'view',
      },
    ],
  },
  {
    label: '布局',
    icon: LayoutDashboard,
    children: [
      {
        label: '侧边栏',
        value: 'z-sidebar',
      },
    ],
  },
  {
    label: '数据录入',
    icon: FormInputIcon,
    children: [
      {
        label: '文本域',
        value: 'z-textarea',
      },
      {
        label: '选择器',
        value: 'select',
      },
      {
        label: '级联选择',
        value: 'cascader',
      },
      {
        label: '日期选择器',
        value: 'z-date-picker',
      },
    ],
  },
  {
    label: '数据展示',
    icon: MenuSquareIcon,
    children: [
      {
        label: '头像',
        value: 'avatar',
      },
      {
        label: '图片',
        value: 'z-image',
      },
      {
        label: '瀑布流',
        value: 'z-waterfall',
      },
      {
        label: 'Markdown',
        value: 'markdown',
      },
      {
        label: '聊天',
        value: 'z-chat',
      },
    ],
  },
  {
    label: '反馈',
    icon: CircleAlertIcon,
    children: [
      {
        label: '弹窗',
        value: 'z-dialog',
      },
      {
        label: '消息提示',
        value: 'z-message',
      },
    ],
  },
  {
    label: '导航',
    icon: NavigationIcon,
    children: [
      {
        label: '分页',
        value: 'pagination',
      },
    ],
  },
  {
    label: '动画',
    icon: BirdIcon,
    children: [
      {
        label: '交错显示',
        value: 'stagger-reveal',
      },
      {
        label: '折叠动画',
        value: 'fold-animation',
      },
    ],
  },
];

export default function Layout() {
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
      <Link to={`/${item.value}`} className="flex items-center gap-3">
        {item.icon ? (
          <item.icon className="size-4" />
        ) : (
          <ZView className="size-4" />
        )}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <ZSidebar
      header={
        <header className="h-full flex shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="font-medium">@zcat/ui 文档</div>
        </header>
      }
      options={sidebarOptions}
      renderItem={renderItem}
    >
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Outlet />
      </div>
    </ZSidebar>
  );
}
