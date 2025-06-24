export interface SiderBarItem {
  name: string;
  icon: string;
  href: string;
}

interface SiderbarProps {
  items: SiderBarItem[];
  className?: string;
}

export function Sidebar(props: SiderbarProps) {
  return (
    <nav className={props.className}>
      <ul className="menu p-4 w-full">
        {props.items.map((item, index) => (
          <li key={index}>
            <a href={item.href} className="flex items-center space-x-3 text-base-content hover:bg-base-200 rounded-lg p-3 transition-colors">
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
