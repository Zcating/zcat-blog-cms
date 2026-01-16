import { ZMarkdown } from '@zcat/ui';

import { ApiTable } from '~/features';

import type { Route } from './+types/z-sidebar-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Sidebar - @zcat/ui' },
    { name: 'description', content: 'Sidebar component documentation' },
  ];
}

const sidebarProps = [
  {
    attribute: 'options',
    type: 'ZSidebarOption[]',
    default: '-',
    description: '侧边栏菜单配置数组',
  },
  {
    attribute: 'renderItem',
    type: '(item: ZSidebarItemConfig) => React.ReactNode',
    default: '-',
    description: '自定义菜单项渲染函数',
  },
  {
    attribute: 'header',
    type: 'React.ReactNode',
    default: '-',
    description: '顶部导航栏内容（吸顶）',
  },
  {
    attribute: 'sidebarHeader',
    type: 'React.ReactNode',
    default: '-',
    description: '侧边栏顶部内容',
  },
  {
    attribute: 'sidebarFooter',
    type: 'React.ReactNode',
    default: '-',
    description: '侧边栏底部内容',
  },
  {
    attribute: 'footer',
    type: 'React.ReactNode',
    default: '-',
    description: '主内容区域底部内容',
  },
  {
    attribute: 'children',
    type: 'React.ReactNode',
    default: '-',
    description: '主内容区域',
  },
];

const sidebarOptionProps = [
  {
    attribute: 'label',
    type: 'string',
    default: '-',
    description: '菜单项显示的文本',
  },
  {
    attribute: 'value',
    type: 'string',
    default: '-',
    description: '菜单项的值（可选，通常用于路由）',
  },
  {
    attribute: 'icon',
    type: 'React.ComponentType',
    default: '-',
    description: '菜单项图标组件',
  },
  {
    attribute: 'children',
    type: 'ZSidebarOption[]',
    default: '-',
    description: '子菜单项配置',
  },
  {
    attribute: 'open',
    type: 'boolean',
    default: '-',
    description: '是否默认展开（仅对有子菜单的项有效）',
  },
];

const usageCode = `\`\`\`typescript
import { ZSidebar, type ZSidebarOption, ZView } from '@zcat/ui';
import { Home, Settings, User } from 'lucide-react';
import { Link, Outlet } from 'react-router';

const sidebarOptions: ZSidebarOption[] = [
  {
    label: '首页',
    value: 'home',
    icon: Home,
  },
  {
    label: '系统管理',
    icon: Settings,
    children: [
      {
        label: '用户管理',
        value: 'users',
        icon: User,
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
      <Link to={\`/\${item.value}\`} className="flex items-center gap-3">
        {item.icon && <item.icon className="size-4" />}
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <ZSidebar
      header={<div className="p-4 font-bold">Logo</div>}
      options={sidebarOptions}
      renderItem={renderItem}
    >
      <Outlet />
    </ZSidebar>
  );
}
\`\`\`
`;

export default function ZSidebarPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Sidebar 侧边栏布局
        </h1>
        <p className="text-muted-foreground">
          提供了一套标准的侧边栏布局结构，包含头部、侧边栏菜单和内容区域。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">使用示例</h2>
        <div className="rounded-md border p-4 bg-muted/50">
          <ZMarkdown content={usageCode} />
        </div>
      </div>
      <ApiTable title="ZSiderbarProps 参数参考" data={sidebarProps} />
      <ApiTable title="ZSidebarOption 参数参考" data={sidebarOptionProps} />
    </div>
  );
}
