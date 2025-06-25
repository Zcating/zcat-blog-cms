import type { DialogHTMLAttributes } from 'react';
import { createPortal } from 'react-dom';
import { UiProviderContext } from './ui-provider';

export namespace Dialog {
  let currentDialog: HTMLDialogElement;

  export function show() {
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('Dialog portal root not found');
    }

    const handleRef = (ref: HTMLDialogElement) => {
      currentDialog = ref;
      ref.showModal();
    };

    const dialog = createPortal(
      <dialog ref={handleRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Hello!</h3>
          <p className="py-4">
            Press ESC key or click the button below to close
          </p>
          <div className="modal-action">
            <form method="dialog">
              {/* if there is a button in form, it will close the modal */}
              <button className="btn">Close</button>
            </form>
          </div>
        </div>
      </dialog>,
      portalRoot,
      'dialog-portal',
    );

    UiProviderContext.set({ portal: dialog });
  }

  export function close() {
    if (currentDialog) {
      currentDialog.close();
    }
  }
}
