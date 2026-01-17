import { Textarea } from '@zcat/ui/shadcn';

interface ZTextareaProps extends React.ComponentProps<'textarea'> {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ZTextarea(props: ZTextareaProps) {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    props.onValueChange?.(e.target.value);
  };
  return <Textarea value={props.value} onChange={handleChange} />;
}
