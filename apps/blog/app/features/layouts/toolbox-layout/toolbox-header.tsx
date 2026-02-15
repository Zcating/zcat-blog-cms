import {
  Button,
  ZNavigationMenu,
  ZStickyHeader,
  Separator,
  useSidebar,
  ZView,
} from '@zcat/ui';
import { SidebarIcon } from 'lucide-react';
import { Link, useLocation } from 'react-router';

import { MENU_OPTIONS } from '../options';

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
      <ZView className="flex h-full w-full items-center gap-2 px-4">
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
          options={MENU_OPTIONS}
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
      </ZView>
    </ZStickyHeader>
  );
}
