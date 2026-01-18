import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '@zcat/ui/shadcn/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from '@zcat/ui/shadcn/ui/dialog';
import { isFunction } from '@zcat/ui/utils';

import { ZView } from '../z-view';

interface ZDialogContentProps {
  onClose: () => void;
}

export interface ZDialogProps {
  /** 弹窗标题 */
  title?: React.ReactNode;
  /** 弹窗内容 */
  content?: React.ReactNode | React.FC<ZDialogContentProps>;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消回调 */
  onCancel?: () => void;
  /** 确认回调 */
  onConfirm?: () => void;
  /** 弹窗关闭后的回调 */
  onClose?: () => void;
  /** 是否隐藏取消按钮 */
  hideCancel?: boolean;
  /** 是否隐藏底部按钮栏 */
  hideFooter?: boolean;
}

interface ZDialogContainerProps {
  props: ZDialogProps;
  onDismiss: () => void;
}

interface ContaienrRef {
  close(): void;
}

const DialogContainer = React.forwardRef<ContaienrRef, ZDialogContainerProps>(
  ({ props, onDismiss }, ref) => {
    const [open, setOpen] = useState(true);

    const handleClose = (isOpen: boolean) => {
      if (isOpen) {
        return;
      }
      setOpen(false);
      // 等待动画结束后销毁 DOM
      setTimeout(() => {
        if (isFunction(onDismiss)) {
          onDismiss();
        }
        props.onClose?.();
      }, 300);
    };

    const close = () => {
      handleClose(false);
    };

    React.useImperativeHandle(ref, () => ({
      close,
    }));

    const onCancel = () => {
      if (isFunction(props.onCancel)) {
        props.onCancel();
      }
      close();
    };

    const onConfirm = async () => {
      if (isFunction(props.onConfirm)) {
        props.onConfirm();
      }
      close();
    };

    const content = isFunction(props.content) ? (
      <props.content onClose={close} />
    ) : (
      props.content
    );

    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          {props.title && (
            <DialogHeader>
              <DialogTitle>{props.title}</DialogTitle>
            </DialogHeader>
          )}

          <ZView className="py-2">{content}</ZView>

          {!props.hideFooter && (
            <DialogFooter>
              {!props.hideCancel && (
                <Button variant="outline" onClick={onCancel}>
                  {props.cancelText || '取消'}
                </Button>
              )}
              <Button onClick={onConfirm}>{props.confirmText || '确定'}</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    );
  },
);

DialogContainer.displayName = 'DialogContainer';

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

export const ZDialog = {
  /**
   * 显示一个命令式弹窗
   * @param props 弹窗配置项
   */
  show: async (props: ZDialogProps) => {
    const portal = createPortal();

    const resolvers = Promise.withResolvers<void>();

    let containerRef: ContaienrRef | null = null;
    const setContaienrRef = (ref: ContaienrRef) => {
      containerRef = ref;
    };

    const dialogRef = {
      close: () => {
        containerRef?.close();
        resolvers.resolve();
      },
    };

    const currentProps: ZDialogProps = {
      ...props,
      onClose() {
        if (isFunction(props.onClose)) {
          props.onClose();
        }
        dialogRef.close();
      },
    };

    portal.root.render(
      <DialogContainer
        ref={setContaienrRef}
        props={currentProps}
        onDismiss={portal.destroy}
      />,
    );

    return resolvers.promise;
  },
};
