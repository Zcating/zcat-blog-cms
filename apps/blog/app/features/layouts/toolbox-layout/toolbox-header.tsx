import {
  Button,
  ZNavigationMenu,
  ZStickyHeader,
  Separator,
  useSidebar,
} from '@zcat/ui';
import { SidebarIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

const menuOptions = [
  { to: '/', title: '首页' },
  { to: '/post-board', title: '文章' },
  { to: '/gallery', title: '相册' },
  { to: '/toolbox', title: '工具箱' },
  { to: '/about', title: '关于' },
];

export function ToolbarHeader() {
  const { toggleSidebar } = useSidebar();
  const { pathname } = useLocation();

  const checkIsActive = (to: string) => {
    if (to === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(to);
  };

  return (
    <ZStickyHeader>
      <div className="flex h-full w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <ZNavigationMenu
          options={menuOptions}
          renderItem={(option, index) => {
            const isActive = checkIsActive(option.to);
            return (
              <Link
                key={index.toString()}
                to={option.to}
                className={
                  isActive
                    ? 'text-primary font-medium transition-colors'
                    : 'text-muted-foreground hover:text-primary transition-colors'
                }
              >
                {option.title}
              </Link>
            );
          }}
        />
      </div>
    </ZStickyHeader>
  );
}
