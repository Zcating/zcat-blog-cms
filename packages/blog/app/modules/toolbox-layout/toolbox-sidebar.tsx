import * as React from "react";

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
} from "@blog/components/ui/sidebar";
import { ToolbarHeader } from "./toolbox-header";
import { ToolboxFooter } from "./toolbox-footer";
import { View } from "@blog/components";
import { Link } from "react-router";
import { ChevronRight } from "lucide-react";
import {
  CollapsibleContent,
  CollapsibleTrigger,
  Collapsible,
} from "@blog/components/ui/collapsible";

interface ToolboxSidebarMenuItemProps {
  title: string;
  to: string;
  icon?: React.FC<any>;
}

interface ToolboxSidebarProps {
  items: ZCollapsibleProps[];
  children: React.ReactNode;
}

export function ToolboxSidebar(props: ToolboxSidebarProps) {
  const { items, children } = props;
  return (
    <SidebarProvider className="flex flex-col">
      <ToolbarHeader />
      <View className="flex flex-1">
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
            {items.map((item, index) => (
              <ZCollapsible key={index.toString()} {...item} />
            ))}
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <View className="min-h-[calc(100svh-var(--header-height)-var(--footer-height))]">
            {children}
          </View>
          <ToolboxFooter />
        </SidebarInset>
      </View>
    </SidebarProvider>
  );
}

interface ZCollapsibleProps {
  title: string;
  icon?: React.FC<any>;
  items: ToolboxSidebarMenuItemProps[];
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
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to}>
                      {item.icon ? <item.icon /> : null}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}
