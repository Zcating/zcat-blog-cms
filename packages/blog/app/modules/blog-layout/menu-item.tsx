import { NavigationMenuItem, NavigationMenuLink } from "@blog/components";
import { Link, useLocation } from "react-router";

interface MenuItemProps {
  to: string;
  title: string;
}
export function MenuItem(props: MenuItemProps) {
  return (
    <NavigationMenuItem>
      <NavigationMenuLink asChild>
        <Link reloadDocument to={props.to}>
          {props.title}
        </Link>
      </NavigationMenuLink>
    </NavigationMenuItem>
  );
}
