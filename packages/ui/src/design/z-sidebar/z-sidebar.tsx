import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { ZCollapsible } from '@zcat/ui/design/z-collapsible';
import { useAdaptElement } from '@zcat/ui/hooks';
import { cn } from '@zcat/ui/shadcn/lib/utils';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@zcat/ui/shadcn/ui/sidebar';

import { ZView } from '../z-view';

function isEqual(a: unknown, b: unknown): boolean {
  return a === b;
}
interface ZSidebarItemConfig {
  label: string;
  value?: string;
  icon?: React.ComponentType<any>;
}

type ZSidebarIsActiveFn = (
  value: string | undefined,
  activeValue: string | undefined,
) => boolean;

export interface ZSidebarOption extends ZSidebarItemConfig {
  open?: boolean;
  children?: ZSidebarItemConfig[];
}

export interface ZSidebarProps {
  options: ZSidebarOption[];
  renderItem: (item: ZSidebarItemConfig) => React.ReactNode;
  children?: React.ReactNode;
  header?: React.ReactNode | React.ComponentType<any>;
  footer?: React.ReactNode | React.ComponentType<any>;
  sidebarHeader?: React.ReactNode | React.ComponentType<any>;
  sidebarFooter?: React.ReactNode | React.ComponentType<any>;
  className?: string;
  style?: React.CSSProperties;
  currentValue?: string;
  isActive?: ZSidebarIsActiveFn;
}

export function ZSidebar(props: ZSidebarProps) {
  const {
    options,
    children,
    renderItem,
    header,
    sidebarHeader,
    sidebarFooter,
    footer,
    className,
    style,
    currentValue,
    isActive = isEqual,
  } = props;

  const adaptedHeader = useAdaptElement(header);
  const adaptedFooter = useAdaptElement(footer);
  const adaptedSidebarHeader = useAdaptElement(sidebarHeader);
  const adaptedSidebarFooter = useAdaptElement(sidebarFooter);

  return (
    <SidebarProvider className={cn('flex flex-col', className)} style={style}>
      <ZView className="sticky top-0 z-10 h-header-height bg-sidebar-header">
        {adaptedHeader}
      </ZView>
      <ZView className="flex flex-1">
        <Sidebar className="top-header-height h-sidebar-height">
          <SidebarHeader>{adaptedSidebarHeader}</SidebarHeader>
          <SidebarContent className="mx-4">
            {options.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <SidebarCollapsibleItem
                    key={index.toString()}
                    item={item}
                    renderItem={renderItem}
                    currentValue={currentValue}
                    isActive={isActive}
                  />
                );
              }
              return (
                <ZSidebarMenuItem
                  key={index.toString()}
                  item={item}
                  renderItem={renderItem}
                  currentValue={currentValue}
                  isActive={isActive}
                />
              );
            })}
          </SidebarContent>
          <SidebarFooter>{adaptedSidebarFooter}</SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ZView className="h-sidebar-content w-full">{children}</ZView>
          <ZView className="h-footer-height">{adaptedFooter}</ZView>
        </SidebarInset>
      </ZView>
    </SidebarProvider>
  );
}

interface SidebarCollapsibleItemProps {
  item: ZSidebarOption;
  renderItem: ZSidebarProps['renderItem'];
  currentValue?: string;
  isActive: ZSidebarIsActiveFn;
}

function SidebarCollapsibleItem({
  item,
  renderItem,
  currentValue,
  isActive,
}: SidebarCollapsibleItemProps) {
  const [isOpen, setIsOpen] = React.useState(!!item.open);
  return (
    <SidebarGroup>
      <ZCollapsible
        className="group/collapsible"
        open={isOpen}
        onOpenChange={setIsOpen}
        trigger={
          <SidebarGroupLabel
            asChild
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm cursor-pointer w-full pl-4"
          >
            <ZView className="flex items-center">
              {renderItem(item)}
              <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
            </ZView>
          </SidebarGroupLabel>
        }
        triggerClassName="p-0 bg-transparent hover:bg-transparent"
      >
        <SidebarGroupContent>
          <SidebarMenu>
            {item.children?.map((subItem, index) => (
              <ZSidebarMenuItem
                key={index.toString()}
                item={subItem}
                renderItem={renderItem}
                currentValue={currentValue}
                isActive={isActive}
              />
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </ZCollapsible>
    </SidebarGroup>
  );
}

interface ZSidebarMenuItemProps {
  item: ZSidebarItemConfig;
  renderItem: ZSidebarProps['renderItem'];
  currentValue?: string;
  isActive: ZSidebarIsActiveFn;
}

function ZSidebarMenuItem({
  item,
  renderItem,
  currentValue,
  isActive,
}: ZSidebarMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="pl-4"
        isActive={isActive(item.value, currentValue)}
      >
        {renderItem(item)}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
