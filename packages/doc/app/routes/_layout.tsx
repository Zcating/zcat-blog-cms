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
import { Link, Outlet, createFileRoute } from '@tanstack/react-router';

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
      {
        label: '折叠面板',
        value: DOCUMENT_CONFIGURES['z-collapsible'].to,
      },
      {
        label: '抽屉',
        value: DOCUMENT_CONFIGURES['z-drawer'].to,
      },
      {
        label: '栅格',
        value: DOCUMENT_CONFIGURES['z-grid'].to,
      },
      {
        label: '树形视图',
        value: DOCUMENT_CONFIGURES['z-tree'].to,
      },
      {
        label: '吸顶页头',
        value: DOCUMENT_CONFIGURES['z-sticky-header'].to,
      },
      {
        label: '导航菜单',
        value: DOCUMENT_CONFIGURES['z-navigation-menu'].to,
      },
    ],
  },
  {
    label: '数据录入',
    icon: FormInputIcon,
    children: [
      {
        label: '输入框',
        value: DOCUMENT_CONFIGURES['z-input'].to,
      },
      {
        label: '文本域',
        value: DOCUMENT_CONFIGURES['z-textarea'].to,
      },
      {
        label: '复选框',
        value: DOCUMENT_CONFIGURES['z-checkbox'].to,
      },
      {
        label: '切换组',
        value: DOCUMENT_CONFIGURES['z-toggle-group'].to,
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
      {
        label: '表单',
        value: DOCUMENT_CONFIGURES['z-form'].to,
      },
      {
        label: '图片上传',
        value: DOCUMENT_CONFIGURES['z-image-upload'].to,
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
        label: '二维码',
        value: DOCUMENT_CONFIGURES['z-qrcode'].to,
      },
      {
        label: 'Markdown',
        value: DOCUMENT_CONFIGURES['z-markdown']?.to ?? 'z-markdown',
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

export const Route = createFileRoute('/_layout')({
  component: Layout,
});

function Layout() {
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
      <Link
        to="/$component"
        params={{ component: item.value }}
        className="flex items-center gap-3"
      >
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
