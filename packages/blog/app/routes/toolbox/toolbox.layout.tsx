import { View } from "@blog/components";
import { ToolboxSidebar } from "@blog/modules";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Outlet } from "react-router";

const items = [
  {
    title: "Home",
    to: "/toolbox",
    icon: Home,
  },
  {
    title: "Base64 to Image",
    to: "/toolbox/base64-to-image",
    icon: Inbox,
  },
  {
    title: "Calendar",
    to: "/calendar",
    icon: Calendar,
  },
  {
    title: "Search",
    to: "/search",
    icon: Search,
  },
  {
    title: "Settings",
    to: "/settings",
    icon: Settings,
  },
];

export default function ToolboxLayout() {
  return (
    <View className="h-full w-full [--header-height:calc(--spacing(20))] [--footer-height:calc(--spacing(10))]">
      <ToolboxSidebar items={items}>
        <Outlet />
      </ToolboxSidebar>
    </View>
  );
}
