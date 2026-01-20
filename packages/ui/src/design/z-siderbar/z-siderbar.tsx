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
  activeValue?: string;
  isActive?: ZSidebarIsActiveFn;
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
    activeValue,
    isActive = isEqual,
  } = props;

  const adaptedHeader = useAdaptElement(header);
  const adaptedFooter = useAdaptElement(footer);
  const adaptedSidebarHeader = useAdaptElement(sidebarHeader);
  const adaptedSidebarFooter = useAdaptElement(sidebarFooter);

  return (
    <SidebarProvider
      className={cn('flex flex-col', className)}
      style={{ ...defaultStyle, ...style }}
    >
      <ZView className="sticky top-0 z-10 h-(--header-height) bg-siderbar-header">
        {adaptedHeader}
      </ZView>
      <ZView className="flex flex-1">
        <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
          <SidebarHeader>{adaptedSidebarHeader}</SidebarHeader>
          <SidebarContent className="mx-4">
            {options.map((item, index) => {
              if (item.children && item.children.length > 0) {
                return (
                  <SidebarCollapsibleItem
                    key={index.toString()}
                    item={item}
                    renderItem={renderItem}
                    activeValue={activeValue}
                    isActive={isActive}
                  />
                );
              }
              return (
                <ZSidebarMenuItem
                  key={index.toString()}
                  item={item}
                  renderItem={renderItem}
                  activeValue={activeValue}
                  isActive={isActive}
                />
              );
            })}
          </SidebarContent>
          <SidebarFooter>{adaptedSidebarFooter}</SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ZView className="min-h-[calc(100svh-var(--header-height)-var(--footer-height))]">
            {children}
          </ZView>
          <ZView className="h-(--footer-height)">{adaptedFooter}</ZView>
        </SidebarInset>
      </ZView>
    </SidebarProvider>
  );
}

interface SidebarCollapsibleItemProps {
  item: ZSidebarOption;
  renderItem: ZSidebarProps['renderItem'];
  activeValue?: string;
  isActive: ZSidebarIsActiveFn;
}

function SidebarCollapsibleItem({
  item,
  renderItem,
  activeValue,
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
                activeValue={activeValue}
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
  activeValue?: string;
  isActive: ZSidebarIsActiveFn;
}

function ZSidebarMenuItem({
  item,
  renderItem,
  activeValue,
  isActive,
}: ZSidebarMenuItemProps) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        className="pl-4"
        isActive={isActive(item.value, activeValue)}
      >
        {renderItem(item)}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
