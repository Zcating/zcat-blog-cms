import { Link } from "react-router";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@blog/components/ui/navigation-menu";

interface LinkOption {
  to: string;
  title: string;
}

interface ZNavigationMenuProps {
  options: LinkOption[];
}

export function ZNavigationMenu(props: ZNavigationMenuProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-3 flex">
        {props.options.map((item, index) => (
          <NavigationMenuItem key={index.toString()}>
            <NavigationMenuLink asChild>
              <Link to={item.to}>{item.title}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
