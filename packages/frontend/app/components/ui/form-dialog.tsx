import { Modal } from './modal';

export namespace FormDialog {
  export interface FormComponentProps<T> {
    initialValues: T;
    confirmText?: string;
    cancelText?: string;
    onSubmit: (data: T) => void;
    onCancel: () => void;
  }

  type TheFormComponentType<T> = React.FC<FormComponentProps<T>>;

  interface TheFormProps<T> {
    title: string;
    confirmText?: string;
    cancelText?: string;
    initialValues: T;
  }

  export type TheFormOpener<T> = (props: TheFormProps<T>) => Promise<T | null>;

  export function create<T>(
    FormComponent: TheFormComponentType<T>,
  ): TheFormOpener<T> {
    return async (props: TheFormProps<T>) => {
      const { title, initialValues, ...rest } = props;
      const resolvers = Promise.withResolvers<T | null>();

      const close = () => {
        resolvers.resolve(null);
        Modal.close();
      };

      const submit = (data: T) => {
        resolvers.resolve(data);
        Modal.close();
      };

      await Modal.show({
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
