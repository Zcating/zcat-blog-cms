// The `_cms` `beforeLoad` is the single source of truth for the auth gate —
// there is deliberately no `loader()` here.

import {
  Separator,
  SidebarTrigger,
  ZDialog,
  ZNotification,
  ZSidebar,
  ZStickyHeader,
  ZView,
  type ZSidebarOption,
} from '@zcat/ui';
import {
  BookImageIcon,
  Gauge,
  ImageIcon,
  LogOut,
  NotebookIcon,
  SettingsIcon,
  UserIcon,
} from 'lucide-react';
import React from 'react';
import { Link, useLocation, useNavigate } from '@tanstack/react-router';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';

import { logout } from '@cms/server/auth';
import { userInfoQueryOptions } from '@cms/server/users';
import { clearPrivateQueryCache } from '@cms/shared/query';
import { CmsAvatar } from '@cms/shared/ui';

import type { CmsShellUser } from '@cms/shared/auth/cms-access';
import type { UserInfo } from '@cms/server/users/users-helpers';

/**
 * Layout entry — the shell user still arrives from the `_cms` route via
 * prop drilling (we deliberately do NOT reach into the router context
 * here so the layout file can be tested with a plain JSX render), but it
 * is only the FALLBACK: the sidebar reads the live `['users','current']`
 * entry so a profile save repaints it without a navigation. `_cms`'s
 * `beforeLoad` seeds that cache before the layout renders, so the first
 * paint is identical either way.
 */
export function CMSLayoutShell({
  cmsUser,
  children,
}: {
  cmsUser?: CmsShellUser;
  children: React.ReactNode;
}) {
  return <Layout cmsUser={cmsUser}>{children}</Layout>;
}

function isActive(value: string | undefined, activeValue: string | undefined) {
  return !!activeValue?.startsWith(value ?? '');
}

interface LayoutProps {
  cmsUser?: CmsShellUser;
  children: React.ReactNode;
}

/**
 * Reactive read of the canonical user entry.
 *
 * `useQuery(userInfoQueryOptions())` would also work, but it registers an
 * observer: the moment `clearPrivateQueryCache` drops the entry during
 * logout, the observer rebuilds the query and fires a `getCurrentUser()`
 * request into a session that no longer exists. Reading the store
 * directly keeps the sidebar in sync with the cache while leaving the
 * cache's lifecycle entirely to whoever writes it.
 */
function readCachedUser(queryClient: QueryClient): UserInfo | undefined {
  return queryClient
    .getQueryCache()
    .find<UserInfo>({ queryKey: userInfoQueryOptions().queryKey })?.state.data;
}

function useCachedUser(): UserInfo | undefined {
  const queryClient = useQueryClient();
  return React.useSyncExternalStore(
    (onStoreChange) => queryClient.getQueryCache().subscribe(onStoreChange),
    () => readCachedUser(queryClient),
    () => readCachedUser(queryClient),
  );
}

function Layout({ cmsUser, children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useCachedUser();
  const name = currentUser?.name ?? cmsUser?.name ?? '';
  const avatar = currentUser?.signedAvatar ?? cmsUser?.signedAvatar ?? '';

  const handleLogout = async () => {
    const confirmed = await ZDialog.confirm({
      title: '退出登录',
      content: '确认退出当前账号？',
      confirmText: '退出',
      cancelText: '取消',
    });
    if (!confirmed) return;

    let logoutError: unknown;
    try {
      await logout();
    } catch (error) {
      logoutError = error;
    }
    // Wipe the entire private Query cache so no stale user/tenant
    // data lingers on the next session. The browser singleton is
    // preserved — only the entries are dropped. This must run even
    // when `logout()` rejected, so it is never inside the try above.
    clearPrivateQueryCache(queryClient);
    await navigate({ to: '/login' });

    if (logoutError !== undefined) {
      await ZNotification.error(
        logoutError instanceof Error ? logoutError.message : '退出失败，请重试',
      );
    }
  };

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
      <Link to={item.value} className="flex items-center gap-3 h-12">
        {item.icon ? (
          <item.icon className="size-6" />
        ) : (
          <ZView className="size-6" />
        )}
        <span className="text-[16px]">{item.label}</span>
      </Link>
    );
  };

  return (
    <ZSidebar
      header={
        <ZStickyHeader className="items-center">
          <SidebarTrigger className="mx-2" />
          <Separator orientation="vertical" className="h-4" />
          <div className="ml-10 font-medium">ZCAT CMS</div>
        </ZStickyHeader>
      }
      options={menuItems}
      renderItem={renderItem}
      currentValue={location.pathname}
      isActive={isActive}
      sidebarFooter={
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <CmsAvatar
              src={avatar}
              name={name}
              size="sm"
              className="w-8 h-8 shrink-0"
            />
            <span className="text-sm font-medium truncate">{name}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center justify-center w-8 h-8 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors shrink-0"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      }
    >
      <ZView className="w-full h-full flex flex-col relative overflow-hidden">
        <ZView
          id="cms-layout-content"
          className="absolute top-0 left-0 bottom-0 right-0 overflow-auto"
        >
          {children}
        </ZView>
      </ZView>
    </ZSidebar>
  );
}

const menuItems: ZSidebarOption[] = [
  {
    label: '仪表盘',
    value: '/dashboard',
    icon: Gauge,
  },
  {
    label: '文章管理',
    value: '/articles',
    icon: NotebookIcon,
  },
  {
    label: '相册管理',
    value: '/albums',
    icon: BookImageIcon,
  },
  {
    label: '照片管理',
    value: '/photos',
    icon: ImageIcon,
  },
  {
    label: '用户信息',
    value: '/user-info',
    icon: UserIcon,
  },
  {
    label: '系统设置',
    value: '/settings',
    icon: SettingsIcon,
  },
];
