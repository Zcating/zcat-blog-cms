import { ZNavigationMenu, ZStickyHeader } from "@blog/components";

export function BlogHeader() {
  return (
    <ZStickyHeader>
      <ZNavigationMenu
        options={[
          { to: "/", title: "首页" },
          { to: "/post-board", title: "文章" },
          { to: "/gallery", title: "相册" },
          { to: "/toolbox", title: "工具箱" },
          { to: "/about", title: "关于" },
        ]}
      />
    </ZStickyHeader>
  );
}
