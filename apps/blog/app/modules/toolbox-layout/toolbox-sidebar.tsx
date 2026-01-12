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
  CollapsibleContent,
  CollapsibleTrigger,
  Collapsible,
  ZView,
} from "@zcat/ui";
import { ChevronRight } from "lucide-react";
import * as React from "react";
import { Link } from "react-router";

import { ToolboxFooter } from "./toolbox-footer";
import { ToolbarHeader } from "./toolbox-header";

interface ZSidebarMenuItemProps {
  title: string;
  icon?: React.FC<any>;
  to: string;
  items?: never;
}

interface ZCollapsibleItemProps {
  title: string;
  icon?: React.FC<any>;
  to?: never;
  items: ZSidebarMenuItemProps[];
}

export type ZSidebarItemProps = ZSidebarMenuItemProps | ZCollapsibleItemProps;

interface ToolboxSidebarProps {
  items: ZSidebarItemProps[];
  children: React.ReactNode;
}

export function ToolboxSidebar(props: ToolboxSidebarProps) {
  const { items, children } = props;
  return (
    <SidebarProvider className="flex flex-col">
      <ToolbarHeader />
      <ZView className="flex flex-1">
        <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!">
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg" asChild>
                  {/* TODO */}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            {items.map((item, index) => {
              if (item.items) {
                return <ZCollapsible key={index.toString()} {...item} />;
              }
              return <ZSidebarMenuItem key={index.toString()} {...item} />;
            })}
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <ZView className="min-h-[calc(100svh-var(--header-height)-var(--footer-height))]">
            {children}
          </ZView>
          <ToolboxFooter />
        </SidebarInset>
      </ZView>
    </SidebarProvider>
  );
}

interface ZCollapsibleProps {
  title: string;
  icon?: React.FC<any>;
  items: ZSidebarMenuItemProps[];
}

function ZCollapsible(props: ZCollapsibleProps) {
  const { items, title, icon: Icon } = props;
  return (
    <Collapsible title={title} defaultOpen className="group/collapsible">
      <SidebarGroup>
        <SidebarGroupLabel
          asChild
          className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
        >
          <CollapsibleTrigger>
            {Icon ? <Icon /> : null}
            {title}{" "}
            <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <ZSidebarMenuItem key={item.title} {...item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

function ZSidebarMenuItem(props: ZSidebarMenuItemProps) {
  const { title, to, icon: Icon } = props;
  return (
    <SidebarMenuItem className="pl-2">
      <SidebarMenuButton asChild>
        <Link to={to}>
          {Icon ? <Icon /> : null}
          <span>{title}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
