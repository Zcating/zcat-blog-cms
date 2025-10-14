import { useNavigate } from 'react-router';
import { classnames } from '../utils';

export interface SiderBarItemValues {
  name: string;
  icon: React.ReactNode;
  href: string;
}

export interface SiderbarProps {
  currentHref?: string;
  items: SiderBarItemValues[];
  className?: string;
}

export function Sidebar(props: SiderbarProps) {
  const selected = (item: SiderBarItemValues) =>
    props.currentHref?.startsWith(item.href);
  return (
    <nav className={classnames('shadow-sm', props.className)}>
      <ul className="menu p-4">
        {props.items.map((item, index) => (
          <Item key={index.toString()} data={item} selected={selected(item)} />
        ))}
      </ul>
    </nav>
  );
}

interface SiderBarItemProps {
  data: SiderBarItemValues;
  selected?: boolean;
}

function Item(props: SiderBarItemProps) {
  const navigate = useNavigate();
  const handleClick = () => {
    navigate(props.data.href);
  };
  return (
    <li>
      <div
        className={classnames(
          'flex items-center gap-3 text-base-content rounded-lg p-3',
          'hover:bg-gray-300',
          props.selected && 'bg-gray-200',
        )}
        onClick={handleClick}
      >
        <span className="text-lg">{props.data.icon}</span>
        <span>{props.data.name}</span>
      </div>
    </li>
  );
}
