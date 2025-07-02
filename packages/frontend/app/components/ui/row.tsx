import { classnames } from '../utils';

type RowGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

interface RowProps {
  children: React.ReactNode;
  gap: RowGap;
}

export function Row(props: RowProps) {
  const className = classnames('flex flex-row', rowGapClassFrom(props.gap));
  return <div className={className}>{props.children}</div>;
}

const gapMap = new Map([
  ['0', 'gap-0'],
  ['1', 'gap-1'],
  ['2', 'gap-2'],
  ['3', 'gap-3'],
  ['4', 'gap-4'],
  ['5', 'gap-5'],
  ['6', 'gap-6'],
  ['7', 'gap-7'],
  ['8', 'gap-8'],
  ['9', 'gap-9'],
  ['10', 'gap-10'],
]);

function rowGapClassFrom(gap: RowGap) {
  return gapMap.get(gap) || 'gap-0';
}
