# Sidebar 侧边栏布局

提供了一套标准的侧边栏布局结构，包含头部、侧边栏菜单和内容区域。

## Usage

```typescript
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
      <Link to={`/${item.value}`} className="flex items-center gap-3">
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
```

## ZSidebar Props

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| options | ZSidebarOption[] | - | 侧边栏菜单配置数组 |
| renderItem | (item: ZSidebarItemConfig) => React.ReactNode | - | 自定义菜单项渲染函数 |
| header | React.ReactNode | - | 顶部导航栏内容（吸顶） |
| sidebarHeader | React.ReactNode | - | 侧边栏顶部内容 |
| sidebarFooter | React.ReactNode | - | 侧边栏底部内容 |
| footer | React.ReactNode | - | 主内容区域底部内容 |
| children | React.ReactNode | - | 主内容区域 |

## ZSidebarOption Props

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| label | string | - | 菜单项显示的文本 |
| value | string | - | 菜单项的值 |
| icon | React.ComponentType | - | 菜单项图标组件 |
| children | ZSidebarOption[] | - | 子菜单项配置 |
| open | boolean | - | 是否默认展开 |
