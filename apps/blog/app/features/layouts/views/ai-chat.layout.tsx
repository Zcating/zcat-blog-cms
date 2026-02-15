import { ZView } from '@zcat/ui';
import { Outlet } from 'react-router';

import { LayoutHeader } from '../components';
import { MENU_OPTIONS } from '../stores';

export default function AiChatLayout() {
  return (
    <ZView className="h-full w-full">
      <LayoutHeader options={MENU_OPTIONS} />
      <ZView className="h-content-height relative bg-background">
        <Outlet />
      </ZView>
    </ZView>
  );
}
