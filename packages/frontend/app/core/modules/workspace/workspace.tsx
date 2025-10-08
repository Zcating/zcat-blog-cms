import type React from 'react';

interface WorkspaceProps {
  title: string;
  description?: string;
  operation?: React.ReactNode;
  children: React.ReactNode;
}

export function Workspace(props: WorkspaceProps) {
  return (
    <div className="w-full flex flex-col gap-6">
      <div className="text-2xl font-bold">{props.title}</div>
      {props.description && <div>{props.description}</div>}
      {props.operation && <div className="flex gap-5">{props.operation}</div>}
      {props.children}
    </div>
  );
}
