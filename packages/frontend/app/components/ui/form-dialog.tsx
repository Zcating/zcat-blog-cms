import { Modal } from './modal';

export namespace FormDialog {
  export interface FormComponentProps<T> {
    initialValues: T;
    onSubmit: (data: T) => void;
    onCancel: () => void;
  }

  type FormComponentType<T> = React.FC<FormComponentProps<T>>;

  interface FormDialogProps<T> {
    title: string;
    initialValues: T;
  }

  export type FormDialog<T> = (props: FormDialogProps<T>) => Promise<T | null>;

  export function create<T>(
    FormComponent: FormComponentType<T>,
  ): FormDialog<T> {
    return async (props: FormDialogProps<T>) => {
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
