import { Dialog } from './dialog';
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
    title: string;
    confirmText?: string;
    cancelText?: string;
    initialValues: T;
    onSubmit: (data: T) => Promise<void>;
  }

  export type TheFormOpener<T> = (props: TheFormProps<T>) => Promise<void>;

  export function create<T>(
    FormComponent: TheFormComponentType<T>,
  ): TheFormOpener<T> {
    return async (props: TheFormProps<T>) => {
      const { title, initialValues, onSubmit, ...rest } = props;
      const resolvers = Promise.withResolvers<void>();

      const close = () => {
        resolvers.resolve();
        Dialog.close();
      };

      const submit = async (data: T) => {
        await onSubmit(data);
        resolvers.resolve();
        Dialog.close();
      };

      await Dialog.show({
        backdropClose: false,
        content: (
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
      });

      return await resolvers.promise;
    };
  }
}
