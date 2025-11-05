import * as Shadcn from "@blog/components/ui/select";

interface SelectProps {
  className?: string;
  placeholder?: string;
  options: CommonOption[];
  value?: string;
  onChange: (value: string) => void;
}

export function Select({
  className,
  placeholder,
  options,
  value,
  onChange,
}: SelectProps) {
  return (
    <Shadcn.Select value={value} onValueChange={onChange}>
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
