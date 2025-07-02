import { InfoCircleOutlined } from '@ant-design/icons';
import { Modal } from './modal';
import { cn } from '../utils';

export namespace Toast {
  export interface ToastProps {
    duration?: number;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }

  export function show(props: ToastProps) {
    // const duration = props.duration ?? 5000;
    // if (duration >= 0) {
    //   setTimeout(() => {
    //     Modal.close();
    //   }, duration);
    // }

    const typeClass = getTypeClass(props.type);

    return Modal.show({
      // backdropClose: false,
      className: '!bg-transparent',
      contentContainerClassName: 'bg-transparent shadow-none',
      content: (
        <div className="flex flex-col items-center gap-5 w-full">
          <div role="alert" className={cn('alert shadow-lg/20', typeClass)}>
            <InfoCircleOutlined className="text-xl !text-base-100" />
            <span className="text-base-100">{props.message}</span>
          </div>
                    <div role="alert" className={cn('alert shadow-lg/20', typeClass)}>
            <InfoCircleOutlined className="text-xl !text-base-100" />
            <span className="text-base-100">{props.message}</span>
          </div>
          <div role="alert" className={cn('alert shadow-lg/20', typeClass)}>
            <InfoCircleOutlined className="text-xl !text-base-100" />
            <span className="text-base-100">{props.message}</span>
          </div>
        </div>
      ),
      position: 'top',
    });
  }

  export function getTypeClass(type: ToastProps['type']) {
    switch (type) {
      case 'success':
        return 'alert-success';
      case 'error':
        return 'alert-error';
      case 'warning':
        return 'alert-warning';
      case 'info':
        return 'alert-info';
      default:
        return 'alert-info';
    }
  }
}
