# Textarea 文本域

用于输入多行文本的表单控件，支持受控模式。

## Basic Usage

```typescript-demo
import { ZTextarea } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="max-w-sm">
      <ZTextarea placeholder="请输入内容..." />
    </div>
  );
}
```

## Controlled

```typescript-demo
import { ZTextarea } from '@zcat/ui';
import { useState } from 'react';

export function DemoComponent() {
  const [value, setValue] = useState('');

  return (
    <div className="max-w-sm space-y-2">
      <ZTextarea
        value={value}
        onValueChange={setValue}
        placeholder="请输入内容..."
      />
      <p className="text-sm text-muted-foreground">当前值: {value}</p>
    </div>
  );
}
```

## Disabled

```typescript-demo
import { ZTextarea } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="max-w-sm">
      <ZTextarea disabled placeholder="禁止输入" />
    </div>
  );
}
```

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| value | string | - | 文本域的值 |
| onValueChange | (value: string) => void | - | 值改变时的回调 |
| placeholder | string | - | 占位文本 |
| disabled | boolean | false | 是否禁用 |
