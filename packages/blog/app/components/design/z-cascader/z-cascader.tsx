import { usePropsValue } from "@blog/components/hooks";
import {
  Menubar,
  MenubarCheckboxItem,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
  MenubarItem,
} from "@blog/components/ui/menubar";

import * as Shadcn from "@blog/components/ui/select";

import { isFunction } from "@blog/components/utils";
import React from "react";

function queryFirstOption(options: CascaderOption[]) {
  const value: CascaderOption[] = [options[0]];

  let node = options[0].children;
  while (node) {
    value.push(node[0]);
    node = node[0].children;
  }

  return value;
}

interface CascaderOption<T = string> extends CommonOption<T> {
  children?: CascaderOption[];
}
interface ZCascaderProps extends React.ComponentProps<"div"> {
  className?: string;
  placeholder?: string;
  options: CascaderOption[];
  defaultValue?: string[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
}

export function ZCascader({
  className,
  style,
  placeholder,
  options,
  defaultValue = [],
  value,
  onValueChange,
  ...props
}: ZCascaderProps) {
  const [currentValue, setCurrentValue] = usePropsValue({
    defaultValue: defaultValue,
    value: value,
    onChange(v) {
      if (!isFunction(onValueChange)) {
        return;
      }
      onValueChange(v);
    },
  });

  const generate = (currentOptions: CascaderOption[]) => {
    return currentOptions.map((option, index) =>
      option.children && option.children.length > 0 ? (
        <MenubarSub key={index.toString()}>
          <MenubarSubTrigger
            onClick={() => {
              setCurrentValue((prev) => [...prev, option.value]);
              console.log(option);
            }}
          >
            {option.label}
          </MenubarSubTrigger>
          <MenubarSubContent>{generate(option.children)}</MenubarSubContent>
        </MenubarSub>
      ) : (
        <MenubarItem
          key={index.toString()}
          onClick={() => setCurrentValue((prev) => [...prev, option.value])}
        >
          {option.label}
        </MenubarItem>
      ),
    );
  };

  return (
    <Shadcn.Select>
      <Shadcn.SelectTrigger>
        <Shadcn.SelectValue placeholder="Theme" />
      </Shadcn.SelectTrigger>
      <Shadcn.SelectContent>
        <Shadcn.SelectGroup>
          {options.map((option) => (
            <React.Fragment key={option.value}>
              <Shadcn.SelectItem value={option.value}>
                {option.label}
              </Shadcn.SelectItem>
              {option.children ? (
                <Shadcn.SelectGroup>
                  {option.children.map((child) => (
                    <Shadcn.SelectItem
                      className="ml-4"
                      key={child.value}
                      value={child.value}
                    >
                      {child.label}
                    </Shadcn.SelectItem>
                  ))}
                </Shadcn.SelectGroup>
              ) : null}
            </React.Fragment>
          ))}
        </Shadcn.SelectGroup>
      </Shadcn.SelectContent>
    </Shadcn.Select>
  );
}
