import { classnames } from '../utils';

export interface SiderBarItemValues {
  name: string;
  icon: React.ReactNode;
}

export interface SiderbarProps<T extends SiderBarItemValues> {
  className?: string;
  items: T[];
  onClickItem?: (item: T) => void;
  isSelected: (item: T) => boolean;
}

export function Sidebar<T extends SiderBarItemValues>(props: SiderbarProps<T>) {
  const selected = (item: T) => props.isSelected?.(item) || false;
  return (
    <nav className={classnames('shadow-sm', props.className)}>
      <ul className="menu p-4">
        {props.items.map((item, index) => (
          <Item
            key={index.toString()}
            data={item}
            selected={selected(item)}
            onClick={props.onClickItem}
          />
        ))}
      </ul>
    </nav>
  );
}

interface SiderBarItemProps<T extends SiderBarItemValues> {
  data: T;
  selected?: boolean;
  onClick?: (item: T) => void;
}

function Item<T extends SiderBarItemValues>(props: SiderBarItemProps<T>) {
  const handleClick = () => {
    props.onClick?.(props.data);
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
