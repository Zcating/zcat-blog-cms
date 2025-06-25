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
  let currentModal: HTMLDialogElement | null = null;

  export async function show(props: ModalProps) {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('modal portal root not found');
    }
    const backdropClose = props.backdropClose ?? true;
    const resolvers = Promise.withResolvers<HTMLDialogElement>();
    const handleRef = (ref: HTMLDialogElement) => {
      currentModal = ref;
      resolvers.resolve(ref);
    };
    const handleClose = () => {
      close();
      props.onClose?.();
    };
    const modal = createPortal(
      <dialog className="modal" ref={handleRef} onCancel={handleClose}>
        <div className="modal-box">
          <h3 className="font-bold text-lg">{props.title}</h3>
          <div className="py-4">{props.content}</div>
        </div>
        {backdropClose ? (
          <div className="modal-backdrop" onClick={handleClose}></div>
        ) : null}
      </dialog>,
      portalRoot,
      'modal-portal',
    );

    UiProviderContext.set({ portal: modal });

    const modalRef = await resolvers.promise;
    modalRef.showModal();
  }

  export function close() {
    if (!currentModal) {
      return;
    }
    currentModal.close();
    currentModal = null;
    UiProviderContext.set({ portal: null });
  }
}
