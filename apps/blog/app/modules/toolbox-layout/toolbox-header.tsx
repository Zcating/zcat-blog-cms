import { SidebarIcon } from "lucide-react";

import { Button } from "@blog/components/ui/button";
import { Separator } from "@blog/components/ui/separator";
import { useSidebar } from "@blog/components/ui/sidebar";
import { ZNavigationMenu, ZStickyHeader } from "@blog/components";

export function ToolbarHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <ZStickyHeader>
      <div className="flex h-full w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
        </Button>
        <Separator orientation="vertical" className="mr-2 h-4" />
        <ZNavigationMenu
          options={[
            { to: "/", title: "首页" },
            { to: "/post-board", title: "文章" },
            { to: "/gallery", title: "相册" },
            { to: "/toolbox", title: "工具箱" },
            { to: "/about", title: "关于" },
          ]}
        />
      </div>
    </ZStickyHeader>
  );
}
