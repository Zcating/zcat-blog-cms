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

export interface ZDialogProps {
  /** 弹窗标题 */
  title?: React.ReactNode;
  /** 弹窗内容 */
  content?: React.ReactNode;
  /** 取消按钮文本 */
  cancelText?: string;
  /** 确认按钮文本 */
  confirmText?: string;
  /** 取消回调 */
  onCancel?: () => void;
  /** 确认回调，支持 Promise，返回 Promise 时会自动显示 loading */
  onConfirm?: () => void | Promise<void>;
  /** 弹窗关闭后的回调 */
  onClose?: () => void;
  /** 是否隐藏取消按钮 */
  hideCancel?: boolean;
  /** 是否隐藏底部按钮栏 */
  hideFooter?: boolean;
}

function DialogContainer({
  props,
  remove,
}: {
  props: ZDialogProps;
  remove: () => void;
}) {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setOpen(false);
      props.onClose?.();
      // 等待动画结束后销毁 DOM
      setTimeout(remove, 300);
    }
  };

  const onCancel = () => {
    props.onCancel?.();
    handleClose(false);
  };

  const onConfirm = async () => {
    if (props.onConfirm) {
      const result = props.onConfirm();
      if (result instanceof Promise) {
        setLoading(true);
        try {
          await result;
          handleClose(false);
        } catch (e) {
          console.error('Dialog confirm error:', e);
        } finally {
          setLoading(false);
        }
        return;
      }
    }
    handleClose(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        {props.title && (
          <DialogHeader>
            <DialogTitle>{props.title}</DialogTitle>
          </DialogHeader>
        )}

        <div className="py-2">{props.content}</div>

        {!props.hideFooter && (
          <DialogFooter>
            {!props.hideCancel && (
              <Button variant="outline" onClick={onCancel} disabled={loading}>
                {props.cancelText || '取消'}
              </Button>
            )}
            <Button onClick={onConfirm} disabled={loading}>
              {props.confirmText || '确定'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface DialogRef {
  close: () => void;
}

type CreateDialogProps = (ref: DialogRef) => ZDialogProps;

export const ZDialog = {
  /**
   * 显示一个命令式弹窗
   * @param props 弹窗配置项
   */
  show: (props: ZDialogProps | CreateDialogProps) => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    const remove = () => {
      root.unmount();
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    };
    const dialogRef = {
      close: remove,
    };

    let currentProps: ZDialogProps;
    if (isFunction(props)) {
      currentProps = props(dialogRef);
    } else {
      currentProps = props;
    }

    root.render(<DialogContainer props={currentProps} remove={remove} />);

    return {
      close: remove,
    };
  },
};
