import { ZSelect } from '@zcat/ui';
import type { Route } from './+types/select-page';
import { useState } from 'react';

export function meta({}: Route.MetaArgs) {
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
        <p className="text-muted-foreground">下拉选择器，用于从列表中选择一个选项。</p>
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
            Selected value: <span className="font-mono">{value || '(none)'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
