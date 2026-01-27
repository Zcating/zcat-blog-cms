# Select 选择器

下拉选择器，用于从列表中选择一个选项。

## Basic Usage

```typescript-demo
import { ZSelect } from '@zcat/ui';

const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Grapes', value: 'grapes' },
  { label: 'Pineapple', value: 'pineapple' },
];

export function DemoComponent() {
  const [value, setValue] = useState('');

  return (
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
  );
}
```

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| options | \{ label: React.ReactNode; value: T \}[] | - | 选项列表 |
| value | T | - | 当前选中的值 |
| onValueChange | (value: T) => void | - | 值变化时的回调 |
| placeholder | string | - | 占位文本 |
| className | string | - | 自定义类名 |
