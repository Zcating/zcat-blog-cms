import { Modal } from '../ui/modal';

export namespace ZFormDialog {
  export interface FormComponentProps<T> {
    initialValues: T;
    confirmText?: string;
    cancelText?: string;
    onSubmit: (data: T) => Promise<void>;
    onCancel: () => void;
  }

  type ZFormComponentType<T> = React.FC<FormComponentProps<T>>;

  interface TheFormProps<T> {
    title: string;
    confirmText?: string;
    cancelText?: string;
    initialValues: T;
    onSubmit: (data: T) => Promise<void>;
  }

  export type TheFormOpener<T> = (props: TheFormProps<T>) => Promise<void>;

  export function create<T>(
    FormComponent: ZFormComponentType<T>,
  ): TheFormOpener<T> {
    return async (props: TheFormProps<T>) =>
      Modal.open((resolve) => {
        const { title, initialValues, onSubmit, ...rest } = props;
        const close = () => {
          resolve();
        };

        const submit = async (data: T) => {
          resolve();
          onSubmit(data);
        };
        return {
          backdropClose: false,
          children: (
            <div className="space-y-5">
              <h3 className="font-bold text-lg">{title}</h3>
              <FormComponent
                {...rest}
                initialValues={initialValues}
                onSubmit={submit}
                onCancel={close}
              />
            </div>
          ),
        };
      });
  }
}
