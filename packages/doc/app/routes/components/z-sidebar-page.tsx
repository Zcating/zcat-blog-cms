import type { Route } from './+types/z-sidebar-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Sidebar - @zcat/ui' },
    { name: 'description', content: 'Sidebar component documentation' },
  ];
}

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
          <pre className="text-sm overflow-x-auto">
            <code>{`import { ZSidebar, type ZSidebarOption, ZView } from '@zcat/ui';
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
}`}</code>
          </pre>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">ZSidebar Props</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">属性</th>
                  <th className="h-10 px-4 text-left font-medium">类型</th>
                  <th className="h-10 px-4 text-left font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-mono">options</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    ZSidebarOption[]
                  </td>
                  <td className="p-4">侧边栏菜单配置数组</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">renderItem</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    (item: ZSidebarItemConfig) =&gt; React.ReactNode
                  </td>
                  <td className="p-4">自定义菜单项渲染函数</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">header</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ReactNode
                  </td>
                  <td className="p-4">顶部导航栏内容（吸顶）</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">sidebarHeader</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ReactNode
                  </td>
                  <td className="p-4">侧边栏顶部内容</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">sidebarFooter</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ReactNode
                  </td>
                  <td className="p-4">侧边栏底部内容</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">footer</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ReactNode
                  </td>
                  <td className="p-4">主内容区域底部内容</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">children</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ReactNode
                  </td>
                  <td className="p-4">主内容区域</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-semibold">ZSidebarOption Interface</h3>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-10 px-4 text-left font-medium">属性</th>
                  <th className="h-10 px-4 text-left font-medium">类型</th>
                  <th className="h-10 px-4 text-left font-medium">说明</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4 font-mono">label</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    string
                  </td>
                  <td className="p-4">菜单项显示的文本</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">value</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    string
                  </td>
                  <td className="p-4">菜单项的值（可选，通常用于路由）</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">icon</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    React.ComponentType
                  </td>
                  <td className="p-4">菜单项图标组件</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">children</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    ZSidebarOption[]
                  </td>
                  <td className="p-4">子菜单项配置</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4 font-mono">open</td>
                  <td className="p-4 font-mono text-muted-foreground">
                    boolean
                  </td>
                  <td className="p-4">是否默认展开（仅对有子菜单的项有效）</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
