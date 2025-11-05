import { NavigationMenu, NavigationMenuList } from "@blog/components";
import { MenuItem } from "./menu-item";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b mb-3 bg-white h-20 flex">
      <NavigationMenu>
        <NavigationMenuList className="gap-3 flex">
          <MenuItem to="/" title="首页" />
          <MenuItem to="/post-board" title="文章" />
          <MenuItem to="/gallery" title="相册" />
          <MenuItem to="/toolbox" title="工具箱" />
          <MenuItem to="/about" title="关于" />
        </NavigationMenuList>
      </NavigationMenu>
    </header>
  );
}
