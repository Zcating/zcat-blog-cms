import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from '@z-ui/components/ui/navigation-menu';

interface LinkOption {
  to: string;
  title: string;
}

interface ZNavigationMenuProps {
  options: LinkOption[];
  renderItem: (item: LinkOption, index: number) => React.ReactNode;
}

export function ZNavigationMenu(props: ZNavigationMenuProps) {
  return (
    <NavigationMenu>
      <NavigationMenuList className="gap-3 flex">
        {props.options.map((item, index) => (
          <NavigationMenuItem key={index.toString()}>
            <NavigationMenuLink asChild>
              {props.renderItem(item, index)}
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
