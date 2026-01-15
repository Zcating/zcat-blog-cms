import { ZButton, ZDialog } from '@zcat/ui';
import type { Route } from './+types/z-dialog-page';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Dialog - @zcat/ui' },
    { name: 'description', content: 'Imperative Dialog component documentation' },
  ];
}

export default function DialogPage() {
  const showSimpleDialog = () => {
    ZDialog.show({
      title: '提示',
      content: '这是一个简单的命令式弹窗',
      onConfirm: () => {
        console.log('点击了确定');
      },
    });
  };

  const showAsyncDialog = () => {
    ZDialog.show({
      title: '异步操作',
      content: '点击确定后会等待 2 秒',
      confirmText: '开始执行',
      onConfirm: async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log('执行完成');
      },
    });
  };

  const showCustomDialog = () => {
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
      hideCancel: true,
      confirmText: '知道了',
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dialog 弹窗</h1>
        <p className="text-muted-foreground">
          基于命令式的弹窗组件，无需在组件中维护 open 状态。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">基础用法</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton onClick={showSimpleDialog}>打开简单弹窗</ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`ZDialog.show({
  title: '提示',
  content: '这是一个简单的命令式弹窗',
  onConfirm: () => {
    console.log('点击了确定');
  },
});`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">异步操作</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton onClick={showAsyncDialog}>打开异步弹窗</ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`ZDialog.show({
  title: '异步操作',
  content: '点击确定后会等待 2 秒',
  confirmText: '开始执行',
  onConfirm: async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    console.log('执行完成');
  },
});`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">自定义内容</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton onClick={showCustomDialog}>打开自定义弹窗</ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`ZDialog.show({
  title: '自定义内容',
  content: (
    <div className="p-4 bg-muted rounded-md">
      <p>这里可以放任意 React 节点</p>
    </div>
  ),
  hideCancel: true,
  confirmText: '知道了',
});`}
          </pre>
        </div>
      </div>
    </div>
  );
}
