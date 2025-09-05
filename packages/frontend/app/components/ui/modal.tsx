import type React from 'react';
import { UiProviderContext } from './ui-provider';
import { createPortal } from 'react-dom';
import { classnames } from '../utils';
import { tv } from 'tailwind-variants';

export namespace Modal {
  let id = 0;

  type ModalPosition = 'top' | 'left' | 'right' | 'bottom' | 'center';

  interface ModalProps {
    className?: string;
    contentContainerClassName?: string;
    children: React.ReactNode;
    onClose?: () => void;
    backdropClose?: boolean;
    position?: ModalPosition;
  }

  const modalTv = tv({
    base: 'modal scrollbar-auto',
    variants: {
      position: {
        center: 'modal-center',
        top: 'modal-top',
        left: 'modal-left',
        right: 'modal-right',
        bottom: 'modal-bottom',
      },
    },
    defaultVariants: {
      position: 'center',
    },
  });

  const idModalMap = new Map<number, HTMLDivElement>();

  type ModalCreate<T> = (resolve: (value?: T) => void) => ModalProps;

  export function open(props: ModalProps): Promise<void>;
  export function open<T>(create: ModalCreate<T>): Promise<T | undefined>;
  export async function open(
    args: ModalProps | ModalCreate<any>,
  ): Promise<any> {
    const currentId = ++id;
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      throw new Error('modal portal root not found');
    }

    const create = parseArgs(args);

    const adapter = createAdapter(currentId, create);

    const modalClass = modalTv({ position: adapter.props.position });
    const backdropClose = adapter.props.backdropClose ?? true;
    const elementResolvers = Promise.withResolvers<HTMLDivElement>();
    const handleRef = (ref: HTMLDivElement) => {
      setTimeout(() => {
        elementResolvers.resolve(ref);
      }, 0);
    };

    const modal = createPortal(
      <div
        key={`modal-${currentId}`}
        className={classnames(modalClass, adapter.props.className)}
        role="dialog"
        ref={handleRef}
      >
        <div
          className={classnames(
            'modal-box p-0',
            adapter.props.contentContainerClassName,
          )}
        >
          {adapter.props.children}
        </div>
        {backdropClose ? (
          <div className="modal-backdrop" onClick={adapter.handleClose}></div>
        ) : null}
      </div>,
      portalRoot,
      `modal-portal-${currentId}`,
    );

    UiProviderContext.add(modal);

    const modalElement = await elementResolvers.promise;

    idModalMap.set(currentId, modalElement);

    modalElement.classList.add('modal-open');

    return await adapter.resolvers.promise;
  }

  function close(currentId: number) {
    const currentModal = idModalMap.get(currentId);
    if (!currentModal) {
      return;
    }

    currentModal.classList.remove('modal-open');
    currentModal.onanimationend = () => {
      UiProviderContext.remove(`modal-portal-${currentId}`);
    };
  }

  /**
   * 解析 modal 构造参数
   * @param args modal参数
   * @returns
   */
  function parseArgs(args: ModalProps | ModalCreate<any>) {
    if (typeof args === 'function') {
      return args;
    }

    return () => args;
  }

  /**
   * 创建一个modal适配器
   * @param id modal实例id
   * @param create modal创建函数
   * @returns
   */
  function createAdapter<T>(id: number, create: ModalCreate<T>) {
    const resolvers = Promise.withResolvers<T | undefined>();

    const props = create(function resolve(value?: T) {
      resolvers.resolve(value);
      close(id);
      props.onClose?.();
    });

    return {
      props,
      handleClose() {
        resolvers.resolve(undefined);
        close(id);
        props.onClose?.();
      },
      resolvers,
    };
  }
}
