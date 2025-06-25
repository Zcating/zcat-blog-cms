import { Modal } from './modal';

export namespace FormDialog {
  type FormComponentType<T> = React.FC<{
    defaultValue: T;
    onSubmit: (data: T) => void;
    onCancel: () => void;
  }>;

  interface FormDialogProps<T> {
    title: string;
    defaultValue: T;
  }

  export type FormDialog<T> = (props: FormDialogProps<T>) => Promise<T | null>;

  export function create<T>(
    FormComponent: FormComponentType<T>,
  ): FormDialog<T> {
    return async (props: FormDialogProps<T>) => {
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
        title: props.title,
        content: (
          <FormComponent
            defaultValue={props.defaultValue}
            onSubmit={submit}
            onCancel={close}
          />
        ),
      });

      return await resolvers.promise;
    };
  }
}
