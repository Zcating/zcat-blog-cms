import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react';

import { useMemoizedFn, usePropsValue } from '@zcat/ui/hooks';
import { useWatch } from '@zcat/ui/hooks/use-watch';
import { cn } from '@zcat/ui/shadcn';
import { Button } from '@zcat/ui/shadcn/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@zcat/ui/shadcn/ui/popover';

import { ZView } from '../z-view';

export interface CascaderOption<T extends string | number = string> {
  label: string;
  value: T;
  children?: CascaderOption<T>[];
}

interface ZCascaderProps<T extends string | number = string> {
  defaultValue?: T[];
  value?: T[];
  onValueChange?: (date: T[]) => void;
  placeholder?: string;
  options?: CascaderOption<T>[];
}

export function ZCascader<T extends string | number = string>({
  defaultValue = [],
  value,
  onValueChange,
  placeholder = '请选择',
  options = [],
}: ZCascaderProps<T>) {
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

  const [activeValue, setActiveValue] = React.useState<T[]>(innerValue);

  //
  const display = React.useMemo(() => {
    const labels = traverseOptionsMap(
      options,
      innerValue,
      (item) => item.label,
    );
    return labels.join(' / ') || placeholder;
  }, [options, innerValue, placeholder]);

  // 检查当前项是否被选中
  const isSelected = (item: CascaderOption<T>, deepIndex: number) => {
    return item.value === activeValue[deepIndex];
  };

  const [displayColumns, setDisplayColumns] = React.useState<
    CascaderOption<T>[][]
  >([options]);

  const [open, setOpen] = React.useState(false);

  useWatch([open], (isOpen) => {
    if (!isOpen) {
      return;
    }
    setActiveValue(innerValue);
    setDisplayColumns(getDisplayColumns(options, innerValue));
  });

  const onSelect = useMemoizedFn(
    (item: CascaderOption<T>, deepIndex: number) => {
      const nextValue = [...activeValue];
      nextValue.splice(deepIndex, nextValue.length - deepIndex);
      nextValue.push(item.value);
      setActiveValue(nextValue);

      if (item.children) {
        setDisplayColumns(getDisplayColumns(options, nextValue));
      } else {
        setOpen(false);
        setInnerValue(nextValue);
      }
    },
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="justify-between font-normal">
          {display}
          <ChevronDownIcon className="size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <ZView className="max-h-[300px] flex">
          {displayColumns.map((options, deepIndex) => (
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

interface CascaderColumnProps<T extends string | number = string> {
  options: CascaderOption<T>[];
  deepIndex: number;
  onSelect: (item: CascaderOption<T>, deepIndex: number) => void;
  isSelected: (item: CascaderOption<T>, deepIndex: number) => boolean;
}

function CascaderColumn<T extends string | number = string>({
  options,
  deepIndex,
  onSelect,
  isSelected,
}: CascaderColumnProps<T>) {
  return (
    <ZView className="flex flex-col overflow-auto gap-1 z-scrollbar">
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

interface CascaderItemProps<T extends string | number = string> {
  item: CascaderOption<T>;
  isLast: boolean;
  deepIndex: number;
  onSelect: (item: CascaderOption<T>, deepIndex: number) => void;
  isSelected: (item: CascaderOption<T>, deepIndex: number) => boolean;
}

function CascaderItem<T extends string | number = string>({
  item,
  isLast,
  deepIndex,
  onSelect,
  isSelected,
}: CascaderItemProps<T>) {
  return (
    <ZView
      className={cn(
        'p-2 mx-1 cursor-pointer flex justify-between items-center rounded-sm transition-colors duration-200',
        'hover:bg-cascader-hover',
        isSelected(item, deepIndex) && 'bg-cascader-selected!',
      )}
      onClick={() => onSelect(item, deepIndex)}
    >
      <ZView className="text-md text-center">{item.label}</ZView>
      {item.children && <ChevronRightIcon className="size-4 opacity-50" />}
    </ZView>
  );
}
/**
 * 获取级联选择器的显示列
 * @param options 级联选择器的选项
 * @param valuePath 级联选择器的路径
 * @returns 级联选择器的显示列
 */
function getDisplayColumns<T extends string | number>(
  options: CascaderOption<T>[],
  valuePath: T[],
): CascaderOption<T>[][] {
  const childrenColumns = traverseOptionsMap(
    options,
    valuePath,
    (item) => item.children || [],
  );
  return [options, ...childrenColumns];
}

/**
 * 遍历级联选择器的选项，根据路径获取对应的值
 * @param options 级联选择器的选项
 * @param valuePath 级联选择器的路径
 * @param callback 回调函数，用于处理每个选项
 * @returns 遍历结果的数组
 */
function traverseOptionsMap<T extends string | number, R>(
  options: CascaderOption<T>[],
  valuePath: T[],
  callback: (item: CascaderOption<T>) => R,
): R[] {
  const selected: R[] = [];
  let currentOptions = options;

  for (const val of valuePath) {
    const targetOption = currentOptions.find((opt) => opt.value === val);
    if (targetOption) {
      selected.push(callback(targetOption));
      currentOptions = targetOption.children || [];
    } else {
      break;
    }
  }

  return selected;
}
