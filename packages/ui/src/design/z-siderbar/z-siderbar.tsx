import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { cn } from '@zcat/ui/shadcn/lib/utils';
import {
  CollapsibleContent,
  CollapsibleTrigger,
  Collapsible,
} from '@zcat/ui/shadcn/ui/collapsible';
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

interface ZSidebarItemConfig {
  label: string;
  value?: string;
  icon?: React.ComponentType<any>;
}

export interface ZSidebarOption extends ZSidebarItemConfig {
  children?: ZSidebarItemConfig[];
}

export interface ZSidebarProps {
  options: ZSidebarOption[];
  renderItem: (item: ZSidebarItemConfig) => React.ReactNode;
  children?: React.ReactNode;
  header?: React.ReactNode;
  sidebarHeader?: React.ReactNode;
  sidebarFooter?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
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
  } = props;

  return (
    <SidebarProvider className={cn('flex flex-col', className)}>
      <ZView className="flex flex-1">
        <Sidebar className="top-(--header-height,0px) h-[calc(100svh-var(--header-height,0px))]!">
          <SidebarHeader>{sidebarHeader}</SidebarHeader>
          <SidebarContent>
            {options.map((item) => {
              if (item.children && item.children.length > 0) {
                return (
                  <ZCollapsible
                    key={item.value}
                    item={item}
                    renderItem={renderItem}
                  />
                );
              }
              return (
                <ZSidebarMenuItem
                  key={item.value}
                  item={item}
                  renderItem={renderItem}
                />
              );
            })}
          </SidebarContent>
          <SidebarFooter>{sidebarFooter}</SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ZView className="min-h-[calc(100svh-var(--header-height,0px)-var(--footer-height,0px))]">
            {header}
            {children}
            {footer}
          </ZView>
        </SidebarInset>
      </ZView>
    </SidebarProvider>
  );
}

interface ZCollapsibleProps {
  item: ZSidebarOption;
  renderItem: ZSidebarProps['renderItem'];
}

function ZCollapsible({ item, renderItem }: ZCollapsibleProps) {
  return (
    <Collapsible title={item.label} defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
        >
          <CollapsibleTrigger>
            {renderItem(item)}
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {item.children?.map((subItem) => (
                <ZSidebarMenuItem
                  key={subItem.value}
                  item={subItem}
                  renderItem={renderItem}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

interface ZSidebarMenuItemProps {
  item: ZSidebarItemConfig;
  renderItem: ZSidebarProps['renderItem'];
}

function ZSidebarMenuItem({ item, renderItem }: ZSidebarMenuItemProps) {
  return (
    <SidebarMenuItem className="pl-2">
      <SidebarMenuButton asChild>{renderItem(item)}</SidebarMenuButton>
    </SidebarMenuItem>
  );
}
