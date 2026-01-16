import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import React from 'react';

import { useMemoizedFn, usePropsValue } from '@zcat/ui/hooks';
import { useWatch } from '@zcat/ui/hooks/use-watch';
import { cn, Separator } from '@zcat/ui/shadcn';
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

  const [activeIndices, setActiveIndices] = React.useState<number[]>([]);

  //
  const display = React.useMemo(() => {
    const indices = valuePathToIndexPath(options, innerValue);
    const labels = traverseOptions(options, indices, (item) => item.label);
    return labels.join(' / ') || placeholder;
  }, [options, innerValue, placeholder]);

  const [displayColumns, setDisplayColumns] = React.useState<
    CascaderOption<T>[][]
  >([options]);

  const [open, setOpen] = React.useState(false);

  useWatch([open], (isOpen) => {
    if (!isOpen) {
      return;
    }
    const indices = valuePathToIndexPath(options, innerValue);
    setActiveIndices(indices);
    setDisplayColumns(getDisplayColumns(options, indices));
  });

  const onSelect = useMemoizedFn(
    (item: CascaderOption<T>, deepIndex: number, index: number) => {
      const nextIndices = [...activeIndices];
      nextIndices.splice(deepIndex, nextIndices.length - deepIndex);
      nextIndices.push(index);
      setActiveIndices(nextIndices);

      if (item.children) {
        setDisplayColumns(getDisplayColumns(options, nextIndices));
      } else {
        setOpen(false);
        const nextValues = indexPathToValuePath(options, nextIndices);
        setInnerValue(nextValues);
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
            <React.Fragment key={deepIndex.toString()}>
              <CascaderColumn
                options={options}
                deepIndex={deepIndex}
                onSelect={onSelect}
                activeIndices={activeIndices}
              />
              {deepIndex < displayColumns.length - 1 && (
                <Separator orientation="vertical" className="h-auto" />
              )}
            </React.Fragment>
          ))}
        </ZView>
      </PopoverContent>
    </Popover>
  );
}

interface CascaderColumnProps<T extends string | number = string> {
  options: CascaderOption<T>[];
  deepIndex: number;
  onSelect: (item: CascaderOption<T>, deepIndex: number, index: number) => void;
  activeIndices: number[];
}

function CascaderColumn<T extends string | number = string>({
  options,
  deepIndex,
  onSelect,
  activeIndices,
}: CascaderColumnProps<T>) {
  return (
    <ZView className="flex flex-col overflow-auto gap-1 z-scrollbar">
      {options.map((item, index) => (
        <CascaderItem
          key={index.toString()}
          item={item}
          isSelected={activeIndices[deepIndex] === index}
          onSelect={() => onSelect(item, deepIndex, index)}
        />
      ))}
    </ZView>
  );
}

interface CascaderItemProps<T extends string | number = string> {
  item: CascaderOption<T>;
  isSelected: boolean;
  onSelect: () => void;
}

function CascaderItem<T extends string | number = string>({
  item,
  isSelected,
  onSelect,
}: CascaderItemProps<T>) {
  return (
    <ZView
      className={cn(
        'p-2 mx-1 cursor-pointer flex justify-between items-center rounded-sm transition-colors duration-200',
        'hover:bg-cascader-hover',
        isSelected && 'bg-cascader-selected!',
      )}
      onClick={onSelect}
    >
      <ZView className="text-md text-center">{item.label}</ZView>
      {item.children && <ChevronRightIcon className="size-4 opacity-50" />}
    </ZView>
  );
}

/**
 * 获取级联选择器的显示列 (使用索引)
 */
function getDisplayColumns<T extends string | number>(
  options: CascaderOption<T>[],
  indexPath: number[],
): CascaderOption<T>[][] {
  const childrenColumns = traverseOptions(
    options,
    indexPath,
    (item) => item.children || [],
  );
  return [options, ...childrenColumns];
}

/**
 * 遍历级联选择器的选项 (使用索引)
 * @param options 级联选择器的选项
 * @param indexPath 索引路径
 * @param callback 回调函数
 * @returns 遍历结果
 */
function traverseOptions<T extends string | number, R>(
  options: CascaderOption<T>[],
  indexPath: number[],
  callback: (item: CascaderOption<T>) => R,
): R[] {
  const selected: R[] = [];
  let currentOptions = options;

  for (const index of indexPath) {
    const targetOption = currentOptions[index];
    if (targetOption) {
      selected.push(callback(targetOption));
      currentOptions = targetOption.children || [];
    } else {
      break;
    }
  }

  return selected;
}

/**
 * 根据值路径获取索引路径
 * @param options 级联选择器的选项
 * @param valuePath 值路径
 * @returns 索引路径
 */
function valuePathToIndexPath<T extends string | number>(
  options: CascaderOption<T>[],
  valuePath: T[],
): number[] {
  const indices: number[] = [];
  let currentOptions = options;

  for (const val of valuePath) {
    const index = currentOptions.findIndex((opt) => opt.value === val);
    if (index !== -1) {
      indices.push(index);
      currentOptions = currentOptions[index].children || [];
    } else {
      break;
    }
  }
  return indices;
}

/**
 * 根据索引路径获取值路径
 * @param options 级联选择器的选项
 * @param indexPath 索引路径
 * @returns 值路径
 */
function indexPathToValuePath<T extends string | number>(
  options: CascaderOption<T>[],
  indexPath: number[],
): T[] {
  const values: T[] = [];
  let currentOptions = options;

  for (const index of indexPath) {
    const option = currentOptions[index];
    if (option) {
      values.push(option.value);
      currentOptions = option.children || [];
    } else {
      break;
    }
  }
  return values;
}
