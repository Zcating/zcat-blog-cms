import { ZDatePicker } from '@zcat/ui';
import dayjs from 'dayjs';
import React from 'react';

import { ApiTable } from '../../features';

import type { Route } from './+types/z-date-picker-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Date Picker - @zcat/ui' },
    { name: 'description', content: 'Date Picker component documentation' },
  ];
}

const apiData = [
  {
    attribute: 'value',
    type: 'dayjs.Dayjs',
    default: '-',
    description: '当前选中的日期（受控）',
  },
  {
    attribute: 'defaultValue',
    type: 'dayjs.Dayjs',
    default: '-',
    description: '默认选中的日期（非受控）',
  },
  {
    attribute: 'onValueChange',
    type: '(date: dayjs.Dayjs) => void',
    default: '-',
    description: '日期改变时的回调',
  },
  {
    attribute: 'placeholder',
    type: 'string',
    default: '"选择日期"',
    description: '输入框占位符',
  },
];

export default function ZDatePickerPage() {
  const [date, setDate] = React.useState<dayjs.Dayjs | undefined>();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Date Picker 日期选择器
        </h1>
        <p className="text-muted-foreground">用于选择或输入日期。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">基本用法</h2>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <ZDatePicker
              placeholder="选择日期"
              value={date}
              onValueChange={(v) => {
                console.log('Selected:', v?.format('YYYY-MM-DD'));
                setDate(v);
              }}
            />
            <span className="text-sm text-muted-foreground">
              当前值: {date?.format('YYYY-MM-DD') || '-'}
            </span>
          </div>
        </div>
      </div>

      <ApiTable data={apiData} />
    </div>
  );
}
