import { Modal } from './modal';

export namespace FormDialog {
  type FormComponentType<T> = React.FC<{
    initialValues: T;
    onSubmit: (data: T) => void;
    onCancel: () => void;
  }>;

  interface FormDialogProps<T> {
    title: string;
    initialValues: T;
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
        content: (
          <div className='space-y-5'>
            <h3 className="font-bold text-lg">{props.title}</h3>
            <FormComponent
              initialValues={props.initialValues}
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
