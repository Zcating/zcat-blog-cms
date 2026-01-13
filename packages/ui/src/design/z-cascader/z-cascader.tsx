import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react';

import { usePropsValue } from '@zcat/ui/hooks';
import { cn, Separator } from '@zcat/ui/shadcn';
import { Button } from '@zcat/ui/shadcn/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@zcat/ui/shadcn/ui/popover';

import { CascadeOption } from '../types';
import { ZView } from '../z-view';

interface ZCascaderProps {
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (date: string[]) => void;
  placeholder?: string;
  options?: CascadeOption[];
}

export function ZCascader({
  defaultValue = [],
  value,
  onValueChange,
  placeholder,
  options = [],
}: ZCascaderProps) {
  const [innerValue, setInnerValue] = usePropsValue({
    defaultValue,
    value,
    onChange: (v) => {
      if (!v || typeof onValueChange !== 'function') {
        return;
      }
      onValueChange(v);
    },
  });

  const display = React.useMemo(() => {
    const labels: string[] = [];
    let currentOptions: CascadeOption[] = options;
    for (const item of innerValue) {
      const option = currentOptions.find((option) => option.value === item);
      if (!option) {
        break;
      }
      labels.push(option.label);
      currentOptions = option.children || [];
    }

    return (labels.join(' / ') || placeholder) ?? '请选择';
  }, [options, innerValue, placeholder]);

  const isSelected = (item: CascadeOption, deepIndex: number) => {
    return item.value === innerValue[deepIndex];
  };

  const [cascadeOptionsArray, setCascadeOptionsArray] = React.useState<
    CascadeOption[][]
  >([options]);

  const onSelect = (item: CascadeOption, deepIndex: number) => {
    setInnerValue((prev) => {
      const newArray = [...prev];
      newArray.splice(deepIndex, newArray.length - deepIndex);
      newArray.push(item.value);

      return newArray;
    });

    if (!item.children) {
      setOpen(false);
      // setInnerValue((prev) => [...prev, item.value]);
      return;
    }

    const options = item.children;
    setCascadeOptionsArray((prev) => {
      const newArray = [...prev];
      if (deepIndex + 1 >= newArray.length) {
        newArray.push(options);
      } else {
        newArray.splice(deepIndex + 1, newArray.length - deepIndex);
        newArray.push(options);
      }
      return newArray;
    });
  };

  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          id="date"
          className="w-48 justify-between font-normal"
        >
          {display}
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <ZView className="max-h-[300px] flex">
          {cascadeOptionsArray.map((options, deepIndex) => (
            <CascaderColumn
              key={deepIndex.toString()}
              options={options}
              deepIndex={deepIndex}
              onSelect={onSelect}
              isSelected={isSelected}
            />
          ))}
        </ZView>
      </PopoverContent>
    </Popover>
  );
}

interface CascaderColumnProps {
  options: CascadeOption[];
  deepIndex: number;
  onSelect: (item: CascadeOption, deepIndex: number) => void;
  isSelected: (item: CascadeOption, deepIndex: number) => boolean;
}

function CascaderColumn({
  options,
  deepIndex,
  onSelect,
  isSelected,
}: CascaderColumnProps) {
  return (
    <ZView className="flex flex-col overflow-auto gap-1">
      {options.map((item, index, arr) => (
        <CascaderItem
          key={index.toString()}
          item={item}
          isLast={index === arr.length - 1}
          deepIndex={deepIndex}
          onSelect={onSelect}
          isSelected={isSelected}
        />
      ))}
    </ZView>
  );
}

interface CascaderItemProps {
  item: CascadeOption;
  isLast: boolean;
  deepIndex: number;
  onSelect: (item: CascadeOption, deepIndex: number) => void;
  isSelected: (item: CascadeOption, deepIndex: number) => boolean;
}

function CascaderItem({
  item,
  isLast,
  deepIndex,
  onSelect,
  isSelected,
}: CascaderItemProps) {
  return (
    <ZView
      className={cn(
        'p-2 mx-1 cursor-pointer flex justify-between items-center rounded-sm transition-colors duration-200',
        'hover:bg-cascader-hover-bg',
        isSelected(item, deepIndex) && 'bg-cascader-selected-bg!',
      )}
      onClick={() => onSelect(item, deepIndex)}
    >
      <ZView className="text-md text-center">{item.label}</ZView>
      {item.children && <ChevronRightIcon className="size-4 opacity-50" />}
    </ZView>
  );
}
