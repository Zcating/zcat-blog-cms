import { ZButton, ZMessage } from '@zcat/ui';

import type { Route } from './+types/z-message-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Message - @zcat/ui' },
    {
      name: 'description',
      content: 'Toast message component documentation',
    },
  ];
}

export default function MessagePage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Message 消息提示</h1>
        <p className="text-muted-foreground">全局展示操作反馈信息。</p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">基础用法</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton onClick={() => ZMessage.success('操作成功')}>
            成功提示
          </ZButton>
          <ZButton
            onClick={() => ZMessage.error('操作失败')}
            variant="destructive"
          >
            失败提示
          </ZButton>
          <ZButton
            onClick={() => ZMessage.info('这是一条信息')}
            variant="outline"
          >
            信息提示
          </ZButton>
          <ZButton
            onClick={() => ZMessage.warning('这是一条警告')}
            variant="secondary"
          >
            警告提示
          </ZButton>
          <ZButton
            onClick={() => {
              const close = ZMessage.loading('加载中...');
              setTimeout(() => {
                close();
              }, 5000);
            }}
            variant="outline"
          >
            加载提示
          </ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`ZMessage.success('操作成功');
ZMessage.error('操作失败');
ZMessage.info('这是一条信息');
ZMessage.warning('这是一条警告');
ZMessage.loading('加载中...');`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">
          手动关闭 Loading
        </h2>
        <p className="text-muted-foreground">
          loading 方法会返回一个关闭函数，调用它可以手动关闭提示。
        </p>
        <div className="flex flex-wrap gap-4">
          <ZButton
            onClick={() => {
              const close = ZMessage.loading('加载中... (3秒后自动关闭)');
              setTimeout(() => {
                close();
              }, 3000);
            }}
            variant="outline"
          >
            自动关闭 Loading
          </ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">
            {`const close = ZMessage.loading('加载中...');
// 在适当的时机调用 close() 关闭提示
setTimeout(() => {
  close();
}, 3000);`}
          </pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">普通提示</h2>
        <div className="flex flex-wrap gap-4">
          <ZButton onClick={() => ZMessage.show('这是一条普通提示')}>
            普通提示
          </ZButton>
        </div>
        <div className="rounded-md bg-muted p-4">
          <pre className="text-sm">{`ZMessage.show('这是一条普通提示');`}</pre>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">自定义位置</h2>
        <div className="flex flex-wrap gap-4">
            <p className="text-sm text-muted-foreground">位置配置在 ZToaster 组件上，默认为 bottom-right。</p>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight">API 参考</h2>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-10 px-4 text-left font-medium">方法</th>
                <th className="h-10 px-4 text-left font-medium">参数</th>
                <th className="h-10 px-4 text-left font-medium">返回值</th>
                <th className="h-10 px-4 text-left font-medium">说明</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4 font-mono">show</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">void</td>
                <td className="p-4">显示普通提示</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">success</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">void</td>
                <td className="p-4">显示成功提示</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">error</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">void</td>
                <td className="p-4">显示错误提示</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">info</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">void</td>
                <td className="p-4">显示信息提示</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">warning</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">void</td>
                <td className="p-4">显示警告提示</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">loading</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (message: string)
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  () =&gt; void
                </td>
                <td className="p-4">显示加载提示，返回关闭函数</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
