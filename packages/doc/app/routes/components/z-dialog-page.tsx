import { ZButton, ZDialog } from '@zcat/ui';
import React from 'react';

import { ApiTable } from '../../features';

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

const apiData = [
  {
    attribute: 'title',
    type: 'ReactNode',
    default: '-',
    description: '弹窗标题',
  },
  {
    attribute: 'content',
    type: 'ReactNode',
    default: '-',
    description: '弹窗内容',
  },
  {
    attribute: 'footer',
    type: 'React.FC<{ onClose: () => void }>',
    default: '-',
    description: '自定义底部区域（通常放按钮）',
  },
  {
    attribute: 'contentContainerClassName',
    type: 'string',
    default: '-',
    description: 'DialogContent 容器样式类名',
  },
  {
    attribute: 'onClose',
    type: '() => void',
    default: '-',
    description: '弹窗关闭后的回调',
  },
];

export default function DialogPage() {
  const showSimpleDialog = () => {
    ZDialog.show({
      title: '提示',
      content: '这是一个简单的命令式弹窗',
      footer: (props) => (
        <React.Fragment>
          <ZButton
            onClick={() => {
              console.log('点击了确定');
              props.onClose();
            }}
          >
            确定
          </ZButton>
        </React.Fragment>
      ),
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
      footer: (props) => (
        <React.Fragment>
          <ZButton onClick={props.onClose}>知道了</ZButton>
        </React.Fragment>
      ),
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
  footer: (props) => (
    <ZButton onClick={props.onClose}>知道了</ZButton>
  ),
});`}
          </pre>
        </div>
      </div>

      <ApiTable data={apiData} />
    </div>
  );
}
