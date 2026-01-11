import { ZNavigationMenu, ZStickyHeader } from "@zcat/ui";
import { Link } from "react-router";

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
        renderItem={(item, index) => (
          <Link key={index.toString()} to={item.to}>
            {item.title}
          </Link>
        )}
      />
    </ZStickyHeader>
  );
}
