import { ZSelect } from '@zcat/ui';
import { useState } from 'react';

import type { Route } from './+types/select-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Select - @zcat/ui' },
    { name: 'description', content: 'Select component documentation' },
  ];
}

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Grapes', value: 'grapes' },
  { label: 'Pineapple', value: 'pineapple' },
];

export default function SelectPage() {
  const [value, setValue] = useState('');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Select 选择器</h1>
        <p className="text-muted-foreground">
          下拉选择器，用于从列表中选择一个选项。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-col gap-4">
          <div className="w-[200px]">
            <ZSelect
              options={options}
              placeholder="Select a fruit"
              value={value}
              onValueChange={setValue}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            Selected value:{' '}
            <span className="font-mono">{value || '(none)'}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">属性</th>
                <th className="h-10 px-4 text-left font-medium">类型</th>
                <th className="h-10 px-4 text-left font-medium">默认值</th>
                <th className="h-10 px-4 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-mono">options</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &#123; label: string; value: T &#125;[]
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">选项列表</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">value</td>
                <td className="p-4 font-mono text-muted-foreground">T</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">当前选中的值</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onValueChange</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (value: T) =&gt; void
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">值变化时的回调</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">placeholder</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">占位文本</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
