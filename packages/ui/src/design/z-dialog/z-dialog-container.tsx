import React from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@zcat/ui/shadcn/ui/dialog';
import { isFunction } from '@zcat/ui/utils';

import { ZView } from '../z-view';

interface ZDialogCloseProps {
  onClose: () => void;
}

export interface ZDialogContentProps {
  /** 弹窗标题 */
  title?: React.ReactNode;
  /** 弹窗内容 */
  content?: React.ReactNode | React.FC<ZDialogCloseProps>;

  footer?: React.FC<ZDialogCloseProps>;

  /** DialogContent 容器样式 */
  contentContainerClassName?: string;

  backdropClose?: boolean;

  /** 弹窗关闭后的回调 */
  onClose?: () => void;
}

interface ZDialogContainerProps {
  props: ZDialogContentProps;
  onDismiss: () => void;
}

export interface ContaienrRef {
  close(): void;
}

export const DialogContainer = React.forwardRef<
  ContaienrRef,
  ZDialogContainerProps
>(({ props, onDismiss }, ref) => {
  const [open, setOpen] = React.useState(true);
  const handleClose = () => {
    setOpen(false);
  };

  const handleAnimationEnd = (event: React.AnimationEvent<HTMLDivElement>) => {
    if (event.animationName !== 'exit') {
      return;
    }
    if (isFunction(onDismiss)) {
      onDismiss();
    }
    if (isFunction(props.onClose)) {
      props.onClose();
    }
  };

  React.useImperativeHandle(ref, () => ({
    close: handleClose,
  }));

  const content = isFunction(props.content) ? (
    <props.content onClose={handleClose} />
  ) : (
    props.content
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className={props.contentContainerClassName}
        backdropClose={props.backdropClose}
        onAnimationEnd={handleAnimationEnd}
      >
        {props.title && (
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
          </DialogHeader>
        )}

        <ZView className="py-2">{content}</ZView>

        {props.footer && (
          <DialogFooter>{<props.footer onClose={handleClose} />}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
});

DialogContainer.displayName = 'DialogContainer';
