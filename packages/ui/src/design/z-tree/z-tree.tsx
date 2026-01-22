import { ChevronRightIcon, ChevronDownIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@zcat/ui/shadcn/lib/utils';

import { CascaderOption } from '../types';
import { ZCollapsible } from '../z-collapsible';
import { ZView } from '../z-view';

export interface ZTreeProps<T extends string | number = string> {
  options: CascaderOption<T>[];
  className?: string;
  onSelect?: (value: T, option: CascaderOption<T>) => void;
  defaultExpandAll?: boolean;
}

interface TreeNodeProps<T extends string | number = string> {
  option: CascaderOption<T>;
  onSelect?: (value: T, option: CascaderOption<T>) => void;
  defaultExpandAll?: boolean;
}

function TreeNode<T extends string | number>({
  option,
  onSelect,
  defaultExpandAll,
}: TreeNodeProps<T>) {
  const [isOpen, setIsOpen] = React.useState(defaultExpandAll ?? false);
  const hasChildren = option.children && option.children.length > 0;

  // Base styles for the row (leaf or parent trigger)
  // Note: For ZCollapsible trigger, we separate padding to inner content to handle click areas correctly
  const rowHoverStyles =
    'cursor-pointer hover:bg-accent/50 rounded-sm transition-colors group';
  const rowContentStyles = 'flex items-center py-1.5 px-2 w-full';

  const renderIcon = () => (
    <ZView
      className={cn(
        'mr-1 flex items-center justify-center w-5 h-5 shrink-0 rounded-sm hover:bg-accent transition-colors',
        !hasChildren && 'invisible',
      )}
      onClick={(e) => {
        if (onSelect && hasChildren) {
          // If onSelect is present, the parent row click would trigger selection.
          // We want arrow click to ONLY toggle.
          // Stop propagation to prevent selection, and manually toggle.
          e.stopPropagation();
          setIsOpen((v) => !v);
        }
        // If no onSelect, let it bubble to the ZCollapsible trigger (or parent div) to toggle.
      }}
    >
      {isOpen ? (
        <ChevronDownIcon className="size-4 opacity-70" />
      ) : (
        <ChevronRightIcon className="size-4 opacity-70" />
      )}
    </ZView>
  );

  const renderLabel = () => <div className="text-sm">{option.label}</div>;

  if (!hasChildren) {
    return (
      <div className="select-none">
        <div
          className={cn(rowHoverStyles, rowContentStyles)}
          onClick={(e) => {
            if (onSelect) {
              e.stopPropagation();
              onSelect(option.value, option);
            }
          }}
        >
          {renderIcon()}
          {renderLabel()}
        </div>
      </div>
    );
  }

  return (
    <ZCollapsible
      className="select-none"
      open={isOpen}
      onOpenChange={setIsOpen}
      triggerClassName={cn(rowHoverStyles, 'w-full text-left')}
      trigger={
        <div
          className={rowContentStyles}
          onClick={(e) => {
            if (onSelect) {
              e.stopPropagation(); // Prevent ZCollapsible toggle
              onSelect(option.value, option);
            }
          }}
        >
          {renderIcon()}
          {renderLabel()}
        </div>
      }
    >
      <div className="pl-6">
        {option.children!.map((child) => (
          <TreeNode
            key={String(child.value)}
            option={child}
            onSelect={onSelect}
            defaultExpandAll={defaultExpandAll}
          />
        ))}
      </div>
    </ZCollapsible>
  );
}

export function ZTree<T extends string | number = string>({
  options,
  className,
  onSelect,
  defaultExpandAll = false,
}: ZTreeProps<T>) {
  return (
    <ZView className={cn('flex flex-col gap-0.5 select-none', className)}>
      {options.map((option) => (
        <TreeNode
          key={String(option.value)}
          option={option}
          onSelect={onSelect}
          defaultExpandAll={defaultExpandAll}
        />
      ))}
    </ZView>
  );
}
