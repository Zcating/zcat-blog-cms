import React from 'react';
import { createRoot } from 'react-dom/client';

import { isFunction } from '@zcat/ui/utils';

import {
  ContainerRef,
  DrawerContainer,
  ZDrawerContentProps,
} from './z-drawer-container';

function createPortal() {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const destroy = () => {
    root.unmount();
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  };
  return {
    root,
    destroy,
  };
}

function createDrawer(props: ZDrawerContentProps) {
  const portal = createPortal();

  let containerRef: ContainerRef | null = null;
  const setContainerRef = (ref: ContainerRef) => {
    containerRef = ref;
  };

  const drawerRef = {
    close: () => {
      containerRef?.close();
    },
  };

  const currentProps: ZDrawerContentProps = {
    ...props,
    onClose() {
      if (isFunction(props.onClose)) {
        props.onClose();
      }
      drawerRef.close();
    },
  };

  portal.root.render(
    <DrawerContainer
      ref={setContainerRef}
      props={currentProps}
      onDismiss={portal.destroy}
    />,
  );

  return drawerRef;
}

export const ZDrawer = {
  /**
   * 显示一个命令式抽屉
   * @param props 抽屉配置项
   */
  show: createDrawer,
};
