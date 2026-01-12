import * as Shadcn from '@zcat/ui/shadcn/ui/select';

interface ZSelectProps<T extends string = string> {
  className?: string;
  placeholder?: string;
  options: CommonOption<T>[];
  value?: T;
  onValueChange?: (value: T) => void;
}

export function ZSelect<T extends string = string>({
  className,
  placeholder,
  options,
  value,
  onValueChange,
}: ZSelectProps<T>) {
  const handleChange = (v: T) => {
    if (v === '') {
      return;
    }
    if (typeof onValueChange !== 'function') {
      return;
    }
    onValueChange(v);
  };
  return (
    <Shadcn.Select value={value} onValueChange={handleChange}>
      <Shadcn.SelectTrigger className={className}>
        <Shadcn.SelectValue placeholder={placeholder} />
      </Shadcn.SelectTrigger>
      <Shadcn.SelectContent>
        <Shadcn.SelectGroup>
          {options.map((option, index) => (
            <Shadcn.SelectItem key={index.toString()} value={option.value}>
              {option.label}
            </Shadcn.SelectItem>
          ))}
        </Shadcn.SelectGroup>
      </Shadcn.SelectContent>
    </Shadcn.Select>
  );
}
