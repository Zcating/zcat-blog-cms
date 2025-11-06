import * as React from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

interface ToolboxSidebarMenuItemProps {
  title: string;
  to: string;
  icon: React.FC<any>;
}

interface ToolboxSidebarProps {
  items: ToolboxSidebarMenuItemProps[];
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
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link to={item.to}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter></SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <View className="min-h-[calc(100svh-var(--header-height)-var(--footer-height))]">
            {props.children}
          </View>
          <ToolboxFooter />
        </SidebarInset>
      </View>
    </SidebarProvider>
  );
}
