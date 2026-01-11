import { cn, View } from "@zcat/ui";
import { ToolboxSidebar, type ZSidebarItemProps } from "@blog/modules";
import { Outlet } from "react-router";

const items = [
  {
    title: "导航",
    to: "/toolbox",
  },
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
