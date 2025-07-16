import type React from 'react';

interface LabelProps {
  label?: string;
  children: React.ReactNode;
}
export function Label(props: LabelProps) {
  return (
    <label className="flex items-center space-x-2">
      <span className="font-bold">{props.label}</span>
      {props.children}
    </label>
  );
}
