import { useForm, type SubmitHandler } from 'react-hook-form';

interface FormProps {
  children: React.ReactNode;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function Form(props: FormProps) {
  const { children, onSubmit, onCancel } = props;
  const { control, register, handleSubmit } = useForm();

  const onSubmitForm: SubmitHandler<any> = (data) => {
    onSubmit(data);
  };
  return (
    <form className="space-y-5" onSubmit={handleSubmit(onSubmitForm)}>
      {children}
    </form>
  );
}
