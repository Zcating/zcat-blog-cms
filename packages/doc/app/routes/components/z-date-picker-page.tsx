import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Date Picker - @zcat/ui' },
    { name: 'description', content: 'Date Picker component documentation' },
  ];
}

const exampleContent = `
# Date Picker 日期选择器

用于选择或输入日期。

## Basic Usage

\`\`\`typescript-demo
import { ZDatePicker } from '@zcat/ui';
import dayjs from 'dayjs';
import React from 'react';

export function DemoComponent() {
  const [date, setDate] = React.useState<dayjs.Dayjs | undefined>();

  return (
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
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| value | dayjs.Dayjs | - | 当前选中的日期（受控） |
| defaultValue | dayjs.Dayjs | - | 默认选中的日期（非受控） |
| onValueChange | (date: dayjs.Dayjs) => void | - | 日期改变时的回调 |
| placeholder | string | '选择日期' | 输入框占位符 |
`;

export default function ZDatePickerPage() {
  return (
    <ZMarkdown
      className="pb-40"
      content={exampleContent}
      customCodeComponents={useConstant(() => ({
        'typescript-demo': ExecutableCodeBlock,
      }))}
    />
  );
}
