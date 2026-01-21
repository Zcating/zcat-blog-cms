import { ZNavigationMenu, ZStickyHeader } from '@zcat/ui';
import { Link, useLocation } from 'react-router';

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
        options={[
          { to: '/', title: '首页' },
          { to: '/post-board', title: '文章' },
          { to: '/gallery', title: '相册' },
          { to: '/toolbox', title: '工具箱' },
          { to: '/about', title: '关于' },
        ]}
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
