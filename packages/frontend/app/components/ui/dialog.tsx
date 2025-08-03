import type React from 'react';
import { UiProviderContext } from './ui-provider';
import { createPortal } from 'react-dom';
import { classnames } from '../utils';
import { tv } from 'tailwind-variants';

export namespace Dialog {
  let id = 0;

  type DialogPosition = 'top' | 'left' | 'right' | 'bottom' | 'center';

  export interface DialogProps {
    className?: string;
    contentContainerClassName?: string;
    content: React.ReactNode;
    onClose?: () => void;
    backdropClose?: boolean;
    position?: DialogPosition;
  }

  const dialogTv = tv({
    base: 'dialog',
    variants: {
      position: {
        center: 'dialog-center',
        top: 'dialog-top',
        left: 'dialog-left',
        right: 'dialog-right',
        bottom: 'dialog-bottom',
      },
    },
    defaultVariants: {
      position: 'center',
    },
  });

  let currentModal: HTMLDivElement | null = null;

  export async function show(props: DialogProps) {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('modal portal root not found');
    }

    const positionClass = dialogTv({ position: props.position });
    const backdropClose = props.backdropClose ?? true;
    const resolvers = Promise.withResolvers<HTMLDivElement>();
    const handleRef = (ref: HTMLDivElement) => {
      currentModal = ref;
      setTimeout(() => {
        resolvers.resolve(ref);
      }, 0);
    };
    const handleClose = () => {
      close();
      props.onClose?.();
    };

    const modal = createPortal(
      <div
        key={`modal-${id++}`}
        className={classnames(
          'modal scrollbar-auto',
          positionClass,
          props.className,
        )}
        role="dialog"
        ref={handleRef}
      >
        <div
          className={classnames('modal-box', props.contentContainerClassName)}
        >
          {props.content}
        </div>
        {backdropClose ? (
          <div className="modal-backdrop" onClick={handleClose}></div>
        ) : null}
      </div>,
      portalRoot,
      'modal-portal',
    );

    UiProviderContext.set({ portal: modal });

    const dialogElement = await resolvers.promise;

    dialogElement.classList.add('modal-open');
  }

  export function close() {
    if (!currentModal) {
      return;
    }

    currentModal.classList.remove('modal-open');
    currentModal.onanimationend = () => {
      currentModal = null;
      UiProviderContext.set({ portal: null });
    };
  }
}
