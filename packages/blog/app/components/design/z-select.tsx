import * as Shadcn from "@blog/components/ui/select";

interface ZSelectProps {
  className?: string;
  placeholder?: string;
  options: CommonOption[];
  value?: string;
  onValueChange?: (value: string) => void;
}

export function ZSelect({
  className,
  placeholder,
  options,
  value,
  onValueChange,
}: ZSelectProps) {
  return (
    <Shadcn.Select value={value} onValueChange={onValueChange}>
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
