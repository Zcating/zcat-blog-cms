import { Outlet } from "react-router";
import { useState } from "react";

export default function CMSLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { name: "仪表盘", icon: "📊", href: "/cms/dashboard" },
    { name: "文章管理", icon: "📝", href: "/cms/articles" },
    { name: "分类管理", icon: "📁", href: "/cms/categories" },
    { name: "标签管理", icon: "🏷️", href: "/cms/tags" },
    { name: "用户管理", icon: "👥", href: "/cms/users" },
    { name: "评论管理", icon: "💬", href: "/cms/comments" },
    { name: "媒体库", icon: "🖼️", href: "/cms/media" },
    { name: "系统设置", icon: "⚙️", href: "/cms/settings" },
  ];

  return (
    <div className="min-h-screen bg-base-200">

      {/* 侧边栏 */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-base-100 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo区域 */}
        <div className="flex items-center justify-center h-16 px-4 bg-primary">
          <h1 className="text-xl font-bold text-primary-content">CMS 管理后台</h1>
        </div>

        {/* 导航菜单 */}
        <nav className="mt-8">
          <ul className="menu p-4 w-full">
            {menuItems.map((item, index) => (
              <li key={index}>
                <a
                  href={item.href}
                  className="flex items-center space-x-3 text-base-content hover:bg-base-200 rounded-lg p-3 transition-colors"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* 用户信息 */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex items-center space-x-3 p-3 bg-base-200 rounded-lg">
            <div className="avatar">
              <div className="w-10 rounded-full">
                <img
                  src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp"
                  alt="用户头像"
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-base-content">管理员</p>
              <p className="text-xs text-base-content/70">admin@example.com</p>
            </div>
            <div className="dropdown dropdown-top dropdown-end">
              <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zM12 13a1 1 0 110-2 1 1 0 010 2zM12 20a1 1 0 110-2 1 1 0 010 2z"
                  />
                </svg>
              </div>
              <ul
                tabIndex={0}
                className="dropdown-content menu bg-base-100 rounded-box z-[1] w-52 p-2 shadow"
              >
                <li>
                  <a>个人设置</a>
                </li>
                <li>
                  <a>退出登录</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="lg:ml-64">
        {/* 顶部导航栏 */}
        <div className="navbar bg-base-100 shadow-sm">
  <div className="flex-1">
    <a className="btn btn-ghost text-xl">daisyUI</a>
  </div>
  <div className="flex-none">
    <button className="btn btn-square btn-ghost">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block h-5 w-5 stroke-current"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path> </svg>
    </button>
  </div>
</div>

        {/* 主内容 */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}