import { ZView } from '@zcat/ui';
import { Outlet } from 'react-router';

import { LayoutContent, LayoutFooter, LayoutHeader } from '../components';
import { MENU_OPTIONS } from '../stores';

export default function BlogLayout() {
  return (
    <ZView className="h-full w-full">
      <LayoutHeader options={MENU_OPTIONS} />
      <LayoutContent>
        <Outlet />
      </LayoutContent>
      <LayoutFooter />
    </ZView>
  );
}
