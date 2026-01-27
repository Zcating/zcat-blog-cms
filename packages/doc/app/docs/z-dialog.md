# Dialog 弹窗

基于命令式的弹窗组件，无需在组件中维护 open 状态。

## Basic Usage

```typescript-demo
import { ZButton, ZDialog } from '@zcat/ui';

export function DemoComponent() {
  const showDialog = () => {
    ZDialog.show({
      title: '提示',
      content: '这是一个简单的命令式弹窗',
      footer: (props) => (
        <ZButton
          onClick={() => {
            console.log('点击了确定');
            props.onClose();
          }}
        >
          确定
        </ZButton>
      ),
    });
  };

  return (
    <div className="flex flex-wrap gap-4">
      <ZButton onClick={showDialog}>打开简单弹窗</ZButton>
    </div>
  );
}
```

## Custom Content

```typescript-demo
import { ZButton, ZDialog } from '@zcat/ui';

export function DemoComponent() {
  const showDialog = () => {
    ZDialog.show({
      title: '自定义内容',
      content: (
        <div className="p-4 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">这里可以放任意 React 节点</p>
          <ul className="list-disc pl-4 mt-2">
            <li>列表项 1</li>
            <li>列表项 2</li>
          </ul>
        </div>
      ),
      footer: (props) => (
        <ZButton onClick={props.onClose}>知道了</ZButton>
      ),
    });
  };

  return (
    <div className="flex flex-wrap gap-4">
      <ZButton onClick={showDialog}>打开自定义弹窗</ZButton>
    </div>
  );
}
```

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| title | ReactNode | - | 弹窗标题 |
| content | ReactNode | - | 弹窗内容 |
| footer | React.FC<{ onClose: () => void }> | - | 自定义底部区域 |
| contentContainerClassName | string | - | DialogContent 容器样式类名 |
| onClose | () => void | - | 弹窗关闭后的回调 |
