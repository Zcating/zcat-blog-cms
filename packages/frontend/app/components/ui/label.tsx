import type React from 'react';

interface LabelProps {
  label?: string;
  children: React.ReactNode;
}
export function Label(props: LabelProps) {
  // <label> 标签会自动触发 <input> 元素的点击事件，导致 <input> 元素的点击事件被触发两次
  const click = (e: React.MouseEvent) => {
    e.stopPropagation();
  };
  return (
    <div className="flex gap-4 items-center" onClick={click}>
      <span className="font-bold min-w-20 ">{props.label}</span>
      {props.children}
    </div>
  );
}
