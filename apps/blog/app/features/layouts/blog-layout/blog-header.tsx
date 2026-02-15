import { ZNavigationMenu, ZStickyHeader } from '@zcat/ui';
import { Link, useLocation } from 'react-router';

import { MENU_OPTIONS } from '../options';

export function BlogHeader() {
  const { pathname } = useLocation();

  const checkIsActive = (to: string) => {
    if (to === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(to);
  };

  return (
    <ZStickyHeader>
      <ZNavigationMenu
        options={MENU_OPTIONS}
        renderItem={(item, index) => {
          const isActive = checkIsActive(item.to);
          return (
            <Link
              key={index.toString()}
              to={item.to}
              className={
                isActive
                  ? 'text-primary font-medium transition-colors'
                  : 'text-muted-foreground hover:text-primary transition-colors'
              }
            >
              {item.title}
            </Link>
          );
        }}
      />
    </ZStickyHeader>
  );
}
