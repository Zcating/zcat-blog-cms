import { tv } from 'tailwind-variants';
import { classnames } from '../utils';

type RowGap = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

interface RowProps {
  children: React.ReactNode;
  gap?: RowGap;
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
}

const rowTv = tv({
  base: 'flex flex-row',
  variants: {
    gap: {
      '0': 'gap-0',
      '1': 'gap-1',
      '2': 'gap-2',
      '3': 'gap-3',
      '4': 'gap-4',
      '5': 'gap-5',
      '6': 'gap-6',
      '7': 'gap-7',
      '8': 'gap-8',
      '9': 'gap-9',
      '10': 'gap-10',
    },
    justify: {
      start: 'justify-start',
      end: 'justify-end',
      center: 'justify-center',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    },
  },
  defaultVariants: {
    gap: '0',
    justify: 'start',
  },
});

export function Row(props: RowProps) {
  const className = classnames(
    'flex flex-row',
    rowTv({ gap: props.gap, justify: props.justify }),
  );
  return <div className={className}>{props.children}</div>;
}
