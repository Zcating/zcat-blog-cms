import { ZTextarea } from '@zcat/ui';
import { useState } from 'react';

import { ApiTable } from '../../features';

import type { Route } from './+types/z-textarea-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Textarea - @zcat/ui' },
    {
      name: 'description',
      content: 'Textarea component documentation',
    },
  ];
}

const apiData = [
  {
    attribute: 'value',
    type: 'string',
    default: '-',
    description: '文本域的值',
  },
  {
    attribute: 'onValueChange',
    type: '(value: string) => void',
    default: '-',
    description: '值改变时的回调',
  },
  {
    attribute: 'placeholder',
    type: 'string',
    default: '-',
    description: '占位文本',
  },
  {
    attribute: 'disabled',
    type: 'boolean',
    default: 'false',
    description: '是否禁用',
  },
];

export default function TextareaPage() {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Textarea 文本域</h1>
        <p className="text-muted-foreground">
          用于输入多行文本的表单控件，支持受控模式。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">基础用法</h2>
        <div className="max-w-sm">
          <ZTextarea placeholder="请输入内容..." />
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`<ZTextarea placeholder="请输入内容..." />`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">受控组件</h2>
        <div className="max-w-sm space-y-2">
          <ZTextarea
            value={value}
            onValueChange={setValue}
            placeholder="请输入内容..."
          />
          <p className="text-sm text-muted-foreground">当前值: {value}</p>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`const [value, setValue] = useState('');

<ZTextarea
  value={value}
  onValueChange={setValue}
  placeholder="请输入内容..."
/>`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">禁用状态</h2>
        <div className="max-w-sm">
          <ZTextarea disabled placeholder="禁止输入" />
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`<ZTextarea disabled placeholder="禁止输入" />`}
          </pre>
        </div>
      </div>

      <ApiTable data={apiData} />
    </div>
  );
}
