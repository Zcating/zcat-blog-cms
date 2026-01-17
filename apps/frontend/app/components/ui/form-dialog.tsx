import { ZDialog } from '@zcat/ui';

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
      return new Promise<void>((resolve) => {
        const { title, initialValues, onSubmit, ...rest } = props;

        let dialogHandle: { close: () => void } | null = null;

        const close = () => {
          dialogHandle?.close();
          resolve();
        };

        const submit = async (data: T) => {
          dialogHandle?.close();
          resolve();
          onSubmit(data);
        };

        dialogHandle = ZDialog.show({
          title,
          hideFooter: true,
          onClose: () => {
            resolve();
          },
          content: (
            <FormComponent
              {...rest}
              initialValues={initialValues}
              onSubmit={submit}
              onCancel={close}
            />
          ),
        });
      });
    };
  }
}
