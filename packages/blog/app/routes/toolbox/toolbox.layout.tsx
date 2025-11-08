import { cn, View } from "@blog/components";
import { ToolboxSidebar } from "@blog/modules";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react";
import { Outlet } from "react-router";

const items = [
  {
    title: "常用",
    items: [
      {
        title: "图片和 Base64 互转",
        to: "/toolbox/base64-to-image",
      },
      {
        title: "身份证生成",
        to: "/toolbox/id-card-generator",
      },
    ],
  },
  {
    title: "算法可视化",
    items: [
      {
        title: "排序可视化",
        to: "/toolbox/sort-visualizer",
      },
      {
        title: "最短路径",
        to: "/toolbox/shortest-path-visualizer",
      },
    ],
  },
];

export default function ToolboxLayout() {
  const classNames = cn(
    "h-full w-full",
    "[--header-height:calc(--spacing(20))] [--footer-height:calc(--spacing(10))]",
  );
  return (
    <View className={classNames}>
      <ToolboxSidebar items={items}>
        <Outlet />
      </ToolboxSidebar>
    </View>
  );
}
