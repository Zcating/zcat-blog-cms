import React from 'react';

import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from '@zcat/ui/shadcn/ui/drawer';
import { isFunction } from '@zcat/ui/utils';

import { ZView } from '../z-view';

interface ZDrawerCloseProps {
  onClose: () => void;
}

export interface ZDrawerContentProps {
  /** 抽屉标题 */
  title?: React.ReactNode;
  /** 抽屉描述 */
  description?: React.ReactNode;
  /** 抽屉内容 */
  content?: React.ReactNode | React.FC<ZDrawerCloseProps>;

  footer?: React.FC<ZDrawerCloseProps>;

  /** DrawerContent 容器样式 */
  contentContainerClassName?: string;

  /** 抽屉方向 */
  direction?: 'top' | 'bottom' | 'left' | 'right';

  /** 抽屉关闭后的回调 */
  onClose?: () => void;
}

interface ZDrawerContainerProps {
  props: ZDrawerContentProps;
  onDismiss: () => void;
}

export interface ContainerRef {
  close(): void;
}

export const DrawerContainer = React.forwardRef<
  ContainerRef,
  ZDrawerContainerProps
>(({ props, onDismiss }, ref) => {
  const [open, setOpen] = React.useState(true);
  const handleClose = () => {
    setOpen(false);
  };

  // 监听动画结束，销毁容器
  // 注意：vaul 可能使用 CSS transition 或 JS 动画，这里做一个兼容处理
  // 如果 350ms 后动画事件没触发，强制销毁
  const dismissedRef = React.useRef(false);

  const handleDismiss = React.useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    if (isFunction(onDismiss)) {
      onDismiss();
    }
    if (isFunction(props.onClose)) {
      props.onClose();
    }
  }, [onDismiss, props]);

  React.useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [open, handleDismiss]);

  React.useImperativeHandle(ref, () => ({
    close: handleClose,
  }));

  const content = isFunction(props.content) ? (
    <props.content onClose={handleClose} />
  ) : (
    props.content
  );

  return (
    <Drawer
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
      }}
      direction={props.direction || 'bottom'}
    >
      <DrawerContent className={props.contentContainerClassName}>
        <DrawerHeader>
          {props.title && <DrawerTitle>{props.title}</DrawerTitle>}
          {props.description && (
            <DrawerDescription>{props.description}</DrawerDescription>
          )}
        </DrawerHeader>

        <ZView className="p-4">{content}</ZView>

        {props.footer && (
          <DrawerFooter>{<props.footer onClose={handleClose} />}</DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
});

DrawerContainer.displayName = 'DrawerContainer';
