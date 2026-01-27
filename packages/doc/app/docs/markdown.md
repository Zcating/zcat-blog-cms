# Markdown 渲染器

基于 React Markdown 的渲染组件，支持代码高亮、数学公式等。

## Basic Usage

```typescript-demo
import { ZButton } from '@zcat/ui';

export function DemoComponent() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '16px', textAlign: 'center' }}>
      <h3 style={{ marginBottom: '12px' }}>计数器示例</h3>
      <p style={{ marginBottom: '12px' }}>当前计数: {count}</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <ZButton variant="default" onClick={() => setCount(count + 1)}>
          +1
        </ZButton>
        <ZButton variant="outline" onClick={() => setCount(count - 1)}>
          -1
        </ZButton>
      </div>
    </div>
  );
}
```

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| content | string | - | Markdown 文本内容 |
| className | string | - | 自定义类名 |
| customCodeComponents | Record<string, React.ComponentType> | - | 自定义代码块组件 |
