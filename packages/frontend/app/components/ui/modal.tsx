import type React from 'react';
import { UiProviderContext } from './ui-provider';
import { createPortal } from 'react-dom';

export namespace Modal {
  export interface ModalProps {
    title: string;
    content: React.ReactNode;
    onClose?: () => void;
    backdropClose?: boolean;
  }
  let currentModal: HTMLDivElement | null = null;

  export async function show(props: ModalProps) {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('modal portal root not found');
    }

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
        className="modal scrollbar-auto modal-end"
        role="dialog"
        ref={handleRef}
      >
        <div className="modal-box">
          <h3 className="font-bold text-lg">{props.title}</h3>
          <div className="py-4">{props.content}</div>
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
}
