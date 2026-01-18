import React from 'react';
import { createRoot } from 'react-dom/client';

import { isFunction } from '@zcat/ui/utils';

import { ZButton } from '../z-button/z-button';

import {
  ContaienrRef,
  DialogContainer,
  ZDialogContentProps,
} from './z-dialog-container';

export interface ZDialogAlertProps {
  /** 弹窗标题 */
  title: React.ReactNode;
  /** 弹窗内容 */
  content: React.ReactNode;

  confirmText?: string;
}

export interface ZDialogConfirmProps {
  /** 弹窗标题 */
  title: React.ReactNode;
  /** 弹窗内容 */
  content: React.ReactNode;

  confirmText?: string;

  cancelText?: string;
}

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

function createDialog(props: ZDialogContentProps) {
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

  const currentProps: ZDialogContentProps = {
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
}

export const ZDialog = {
  alert: async (alertProps: ZDialogAlertProps) => {
    await createDialog({
      title: alertProps.title,
      content: alertProps.content,
      footer: (props) => (
        <React.Fragment>
          <ZButton onClick={props.onClose}>
            {alertProps.confirmText || '确定'}
          </ZButton>
        </React.Fragment>
      ),
    });
  },

  confirm: async (confirmProps: ZDialogConfirmProps) => {
    let isConfirmed = false;
    await createDialog({
      title: confirmProps.title,
      content: confirmProps.content,
      footer: (props) => (
        <React.Fragment>
          <ZButton onClick={props.onClose} variant="outline">
            {confirmProps.cancelText || '取消'}
          </ZButton>
          <ZButton
            onClick={() => {
              isConfirmed = true;
              props.onClose();
            }}
          >
            {confirmProps.confirmText || '确定'}
          </ZButton>
        </React.Fragment>
      ),
    });
    return isConfirmed;
  },

  /**
   * 显示一个命令式弹窗
   * @param props 弹窗配置项
   */
  show: createDialog,
};
