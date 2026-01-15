import { ChevronRight } from 'lucide-react';
import * as React from 'react';

import { ZCollapsible } from '@zcat/ui/design/z-collapsible';
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

interface ZSidebarItemConfig {
  label: string;
  value?: string;
  icon?: React.ComponentType<any>;
}

export interface ZSidebarOption extends ZSidebarItemConfig {
  open?: boolean;
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
  style?: React.CSSProperties;
}

const defaultStyle = {
  '--header-height': 'calc(var(--spacing) * 16)',
  '--footer-height': 'calc(var(--spacing) * 10)',
} as React.CSSProperties;

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
  } = props;

  return (
    <SidebarProvider
      className={cn('flex flex-col', className)}
      style={{ ...defaultStyle, ...style }}
    >
      <ZView className="sticky top-0 z-10 h-(--header-height) bg-siderbar-header">
        {header}
      </ZView>
      <ZView className="flex flex-1">
        <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
          <SidebarHeader>{sidebarHeader}</SidebarHeader>
          <SidebarContent>
            {options.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <SidebarCollapsibleItem
                    key={index.toString()}
                    item={item}
                    renderItem={renderItem}
                  />
                );
              }
              return (
                <ZSidebarMenuItem
                  key={index.toString()}
                  item={item}
                  renderItem={renderItem}
                />
              );
            })}
          </SidebarContent>
          <SidebarFooter>{sidebarFooter}</SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ZView className="min-h-[calc(100svh-var(--header-height)-var(--footer-height))]">
            {children}
          </ZView>
          <ZView className="h-(--footer-height)">{footer}</ZView>
        </SidebarInset>
      </ZView>
    </SidebarProvider>
  );
}

interface SidebarCollapsibleItemProps {
  item: ZSidebarOption;
  renderItem: ZSidebarProps['renderItem'];
}

function SidebarCollapsibleItem({
  item,
  renderItem,
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
            className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm cursor-pointer w-full"
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
}

function ZSidebarMenuItem({ item, renderItem }: ZSidebarMenuItemProps) {
  return (
    <SidebarMenuItem className="pl-2">
      <SidebarMenuButton asChild>{renderItem(item)}</SidebarMenuButton>
    </SidebarMenuItem>
  );
}
