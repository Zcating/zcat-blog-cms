import { classnames } from '../utils';

export interface SiderBarItemValues {
  name: string;
  icon: React.ReactNode;
  href: string;
}

export interface SiderbarProps {
  items: SiderBarItemValues[];
  className?: string;
}

export function Sidebar(props: SiderbarProps) {
  return (
    <nav className={classnames('shadow-sm', props.className)}>
      <ul className="menu p-4">
        {props.items.map((item, index) => (
          <Item key={index.toString()} data={item} />
        ))}
      </ul>
    </nav>
  );
}

interface SiderBarItemProps {
  data: SiderBarItemValues;
}

function Item(props: SiderBarItemProps) {
  return (
    <li>
      <a
        href={props.data.href}
        className="flex items-center space-x-3 text-base-content hover:bg-base-200 rounded-lg p-3 transition-colors"
      >
        <span className="text-lg">{props.data.icon}</span>
        <span>{props.data.name}</span>
      </a>
    </li>
  );
}
