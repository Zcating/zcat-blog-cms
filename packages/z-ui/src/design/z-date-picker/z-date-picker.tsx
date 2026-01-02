import { usePropsValue } from '@z-ui/components/hooks';
import { Button } from '@z-ui/components/ui/button';
import { Calendar } from '@z-ui/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@z-ui/components/ui/popover';
import dayjs from 'dayjs';
import { ChevronDownIcon } from 'lucide-react';
import React from 'react';

interface ZDatePickerProps {
  defaultValue?: dayjs.Dayjs;
  value?: dayjs.Dayjs;
  onValueChange?: (date: dayjs.Dayjs) => void;
  placeholder?: string;
}

export function ZDatePicker({
  defaultValue,
  value,
  onValueChange,
  placeholder,
}: ZDatePickerProps) {
  const [innerValue, setInnerValue] = usePropsValue({
    defaultValue,
    value,
    onChange: (v) => {
      const isValid = !!v && v.isValid();
      if (!isValid || typeof onValueChange !== 'function') {
        return;
      }
      onValueChange?.(v);
    },
  });

  const selectedDate = React.useMemo(() => innerValue?.toDate(), [innerValue]);
  const onSelect = (date: Date) => {
    setOpen(false);
    setInnerValue(dayjs(date));
  };

  const [open, setOpen] = React.useState(false);
  const placeholderText = placeholder ?? '选择日期';
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="w-48 justify-between font-normal"
        >
          {value ? value.format('YYYY-MM-DD') : placeholderText}
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          required
          mode="single"
          captionLayout="dropdown"
          selected={selectedDate}
          onSelect={onSelect}
        />
      </PopoverContent>
    </Popover>
  );
}
