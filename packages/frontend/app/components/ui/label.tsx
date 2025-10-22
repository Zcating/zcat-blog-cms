import type React from 'react';
import { tv } from 'tailwind-variants';

export type LabelSpan =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16;

const labelSpanTv = tv({
  base: 'font-bold',
  variants: {
    span: {
      1: 'w-[6.25%]',
      2: 'w-[12.5%]',
      3: 'w-[18.75%]',
      4: 'w-[25%]',
      5: 'w-[31.25%]',
      6: 'w-[37.5%]',
      7: 'w-[43.75%]',
      8: 'w-[50%]',
      9: 'w-[56.25%]',
      10: 'w-[62.5%]',
      11: 'w-[68.75%]',
      12: 'w-[75%]',
      13: 'w-[81.25%]',
      14: 'w-[87.5%]',
      15: 'w-[93.75%]',
      16: 'w-[100%]',
    },
  },
  defaultVariants: {
    span: 2,
  },
});

interface LabelProps {
  label?: string;
  span?: LabelSpan;
  children: React.ReactNode;
}

export function Label(props: LabelProps) {
  // <label> 标签会自动触发 <input> 元素的点击事件，导致 <input> 元素的点击事件被触发两次
  const click = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  return (
    <div className="flex gap-4 items-center" onClick={click}>
      <span className={labelSpanTv({ span: props.span })}>{props.label}</span>
      {props.children}
    </div>
  );
}
