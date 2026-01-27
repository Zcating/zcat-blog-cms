# Message 消息提示

全局展示操作反馈信息。

## Basic Usage

```typescript-demo
import { ZButton, ZNotification } from '@zcat/ui';

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZButton onClick={() => ZNotification.success('操作成功')}>成功提示</ZButton>
      <ZButton onClick={() => ZNotification.error('操作失败')} variant="destructive">失败提示</ZButton>
      <ZButton onClick={() => ZNotification.info('这是一条信息')} variant="outline">信息提示</ZButton>
      <ZButton onClick={() => ZNotification.warning('这是一条警告')} variant="secondary">警告提示</ZButton>
    </div>
  );
}
```

## Loading

```typescript-demo
import { ZButton, ZNotification } from '@zcat/ui';

export function DemoComponent() {
  const showLoading = async () => {
    const close = await ZNotification.loading('加载中...');
    setTimeout(() => {
      close();
    }, 3000);
  };

  return (
    <div className="flex flex-wrap gap-4">
      <ZButton onClick={showLoading} variant="outline">加载提示</ZButton>
    </div>
  );
}
```

## Methods

| Method | Parameters | Description |
| :--- | :--- | :--- |
| show | message: string | 显示普通提示 |
| success | message: string | 显示成功提示 |
| error | message: string | 显示错误提示 |
| info | message: string | 显示信息提示 |
| warning | message: string | 显示警告提示 |
| loading | message: string | 显示加载提示，返回关闭函数 |
