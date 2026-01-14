import { Modal } from './modal';

export namespace FormDialog {
  export interface FormComponentProps<T> {
    initialValues: T;
    confirmText?: string;
    cancelText?: string;
    onSubmit: (data: T) => Promise<void>;
    onCancel: () => void;
  }

  type TheFormComponentType<T> = React.FC<FormComponentProps<T>>;

  interface TheFormProps<T> {
    initialValues: T;
    title: string;
    confirmText?: string;
    cancelText?: string;
    onSubmit: (data: T) => void;
  }

  export type TheFormOpener<T> = (props: TheFormProps<T>) => Promise<void>;

  export function create<T>(
    FormComponent: TheFormComponentType<T>,
  ): TheFormOpener<T> {
    return async (props: TheFormProps<T>) => {
      return Modal.open((resolve) => {
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
    };
  }
}
