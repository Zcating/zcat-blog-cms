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

import { DOCUMENT_CONFIGURES } from '../docs';

const sidebarOptions: ZSidebarOption[] = [
  {
    label: '通用',
    icon: ComponentIcon,
    children: [
      {
        label: '按钮',
        value: DOCUMENT_CONFIGURES.button.to,
      },
      {
        label: '视图',
        value: DOCUMENT_CONFIGURES.view.to,
      },
    ],
  },
  {
    label: '布局',
    icon: LayoutDashboard,
    children: [
      {
        label: '侧边栏',
        value: DOCUMENT_CONFIGURES['z-sidebar'].to,
      },
    ],
  },
  {
    label: '数据录入',
    icon: FormInputIcon,
    children: [
      {
        label: '文本域',
        value: DOCUMENT_CONFIGURES['z-textarea'].to,
      },
      {
        label: '选择器',
        value: DOCUMENT_CONFIGURES.select.to,
      },
      {
        label: '级联选择',
        value: DOCUMENT_CONFIGURES['z-cascader'].to,
      },
      {
        label: '日期选择器',
        value: DOCUMENT_CONFIGURES['z-date-picker'].to,
      },
    ],
  },
  {
    label: '数据展示',
    icon: MenuSquareIcon,
    children: [
      {
        label: '头像',
        value: DOCUMENT_CONFIGURES['z-avatar'].to,
      },
      {
        label: '图片',
        value: DOCUMENT_CONFIGURES['z-image'].to,
      },
      {
        label: '瀑布流',
        value: DOCUMENT_CONFIGURES['z-waterfall'].to,
      },
      {
        label: 'Markdown',
        value: 'markdown',
      },
      {
        label: '聊天',
        value: DOCUMENT_CONFIGURES['z-chat'].to,
      },
    ],
  },
  {
    label: '反馈',
    icon: CircleAlertIcon,
    children: [
      {
        label: '弹窗',
        value: DOCUMENT_CONFIGURES['z-dialog'].to,
      },
      {
        label: '消息提示',
        value: DOCUMENT_CONFIGURES['z-notification'].to,
      },
    ],
  },
  {
    label: '导航',
    icon: NavigationIcon,
    children: [
      {
        label: '分页',
        value: DOCUMENT_CONFIGURES.pagination.to,
      },
    ],
  },
  {
    label: '动画',
    icon: BirdIcon,
    children: [
      {
        label: '交错显示',
        value: DOCUMENT_CONFIGURES['stagger-reveal'].to,
      },
      {
        label: '折叠动画',
        value: DOCUMENT_CONFIGURES['fold-animation'].to,
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
          <Link className="font-medium cursor-pointer" to="/">
            @zcat/ui 文档
          </Link>
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
