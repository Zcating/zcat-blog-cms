import type React from 'react';
import { UiProviderContext } from './ui-provider';
import { createPortal } from 'react-dom';
import { classnames } from '../utils';

export namespace Modal {
  let id = 0;

  type ModalPosition = 'top' | 'left' | 'right' | 'bottom' | 'center';

  export interface ModalProps {
    className?: string;
    contentContainerClassName?: string;
    content: React.ReactNode;
    onClose?: () => void;
    backdropClose?: boolean;
    position?: ModalPosition;
  }

  let currentModal: HTMLDivElement | null = null;

  export async function show(props: ModalProps) {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('modal portal root not found');
    }

    const positionClass = getPositionClass(props.position ?? 'center');
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

    const modalElement = await resolvers.promise;

    modalElement.classList.add('modal-open');
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

  function getPositionClass(position: ModalPosition) {
    switch (position) {
      case 'center':
        return 'modal-center';
      case 'top':
        return 'modal-top';
      case 'left':
        return 'modal-left';
      case 'right':
        return 'modal-right';
      case 'bottom':
        return 'modal-bottom';
      default:
        return 'modal-center';
    }
  }
}
