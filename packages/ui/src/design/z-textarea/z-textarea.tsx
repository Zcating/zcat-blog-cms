import { Textarea } from '@zcat/ui/shadcn';

interface ZTextareaProps extends React.ComponentProps<'textarea'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ZTextarea(props: ZTextareaProps) {
  const { onValueChange, ...rest } = props;
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onValueChange?.(e.target.value);
  };
  return <Textarea {...rest} onChange={handleChange} />;
}
