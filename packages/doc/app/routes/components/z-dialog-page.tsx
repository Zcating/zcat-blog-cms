import { ZButton, ZDialog } from '@zcat/ui';

import type { Route } from './+types/z-dialog-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Dialog - @zcat/ui' },
    {
      name: 'description',
      content: 'Imperative Dialog component documentation',
    },
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
          <p className="text-sm text-muted-foreground">
            这里可以放任意 React 节点
          </p>
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
                <td className="p-4 font-mono">title</td>
                <td className="p-4 font-mono text-muted-foreground">
                  ReactNode
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">弹窗标题</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">content</td>
                <td className="p-4 font-mono text-muted-foreground">
                  ReactNode
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">弹窗内容</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">confirmText</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;确定&apos;
                </td>
                <td className="p-4">确认按钮文本</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">cancelText</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;取消&apos;
                </td>
                <td className="p-4">取消按钮文本</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onConfirm</td>
                <td className="p-4 font-mono text-muted-foreground">
                  () =&gt; void | Promise&lt;void&gt;
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">
                  确认回调，返回 Promise 时会自动显示 loading
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onCancel</td>
                <td className="p-4 font-mono text-muted-foreground">
                  () =&gt; void
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">取消回调</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">hideCancel</td>
                <td className="p-4 font-mono text-muted-foreground">boolean</td>
                <td className="p-4 font-mono text-muted-foreground">false</td>
                <td className="p-4">是否隐藏取消按钮</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">hideFooter</td>
                <td className="p-4 font-mono text-muted-foreground">boolean</td>
                <td className="p-4 font-mono text-muted-foreground">false</td>
                <td className="p-4">是否隐藏底部按钮栏</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
