import { Outlet } from 'react-router';
import { Navbar, Sidebar } from '@cms/components';

const menuItems = [
  { name: '仪表盘', icon: '📊', href: '/dashboard' },
  { name: '文章管理', icon: '📝', href: '/articles' },
  { name: '分类管理', icon: '📁', href: '/article-categories' },
  { name: '相册管理', icon: '🖼️', href: '/albums' },
  { name: '照片管理', icon: '🖼️', href: '/photos' },
  { name: '用户信息', icon: '👥', href: '/user-info' },
  { name: '系统设置', icon: '⚙️', href: '/settings' },
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
