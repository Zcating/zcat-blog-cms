import { ZCascader } from '@zcat/ui';

import type { Route } from './+types/cascader-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Cascader - @zcat/ui' },
    { name: 'description', content: 'Cascader component documentation' },
  ];
}

const apiData = [
  {
    attribute: 'options',
    type: 'CascaderOption[]',
    default: '[]',
    description: '数据源，结构包含 label, value, children',
  },
  {
    attribute: 'value',
    type: 'T[]',
    default: '-',
    description: '当前选中的值（受控）',
  },
  {
    attribute: 'defaultValue',
    type: 'T[]',
    default: '[]',
    description: '默认选中的值（非受控）',
  },
  {
    attribute: 'onValueChange',
    type: '(value: T[]) => void',
    default: '-',
    description: '选中项变化时的回调',
  },
  {
    attribute: 'placeholder',
    type: 'string',
    default: "'请选择'",
    description: '占位文本',
  },
];

const options = [
  {
    value: 'guide',
    label: 'Guide',
    children: [
      {
        value: 'disciplines',
        label: 'Disciplines',
        children: [
          {
            value: 'consistency',
            label: 'Consistency',
          },
          {
            value: 'feedback',
            label: 'Feedback',
          },
          {
            value: 'efficiency',
            label: 'Efficiency',
          },
          {
            value: 'controllability',
            label: 'Controllability',
          },
        ],
      },
      {
        value: 'navigation',
        label: 'Navigation',
        children: [
          {
            value: 'side-nav',
            label: 'Side Navigation',
          },
          {
            value: 'top-nav',
            label: 'Top Navigation',
          },
        ],
      },
    ],
  },
  {
    value: 'component',
    label: 'Component',
    children: [
      {
        value: 'basic',
        label: 'Basic',
        children: [
          {
            value: 'layout',
            label: 'Layout',
          },
          {
            value: 'color',
            label: 'Color',
          },
          {
            value: 'typography',
            label: 'Typography',
          },
          {
            value: 'icon',
            label: 'Icon',
          },
          {
            value: 'button',
            label: 'Button',
          },
        ],
      },
      {
        value: 'form',
        label: 'Form',
        children: [
          {
            value: 'radio',
            label: 'Radio',
          },
          {
            value: 'checkbox',
            label: 'Checkbox',
          },
          {
            value: 'input',
            label: 'Input',
          },
          {
            value: 'select',
            label: 'Select',
          },
          {
            value: 'cascader',
            label: 'Cascader',
          },
        ],
      },
      {
        value: 'data',
        label: 'Data',
        children: [
          {
            value: 'table',
            label: 'Table',
          },
          {
            value: 'tag',
            label: 'Tag',
          },
          {
            value: 'progress',
            label: 'Progress',
          },
          {
            value: 'tree',
            label: 'Tree',
          },
          {
            value: 'pagination',
            label: 'Pagination',
          },
          {
            value: 'badge',
            label: 'Badge',
          },
        ],
      },
    ],
  },
  {
    value: 'resource',
    label: 'Resource',
    children: [
      {
        value: 'axure',
        label: 'Axure Components',
      },
      {
        value: 'sketch',
        label: 'Sketch Templates',
      },
      {
        value: 'docs',
        label: 'Design Documentation',
      },
    ],
  },
];

export default function CascaderPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cascader 级联选择</h1>
        <p className="text-muted-foreground">
          级联选择框。用于从一组相关联的数据集合中进行选择，例如省市区，公司层级，事物分类等。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Basic Usage</h2>
        <div className="flex flex-wrap gap-4">
          <ZCascader options={options} placeholder="Please select" />
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">Default Value</h2>
        <div className="flex flex-wrap gap-4">
          <ZCascader
            options={options}
            defaultValue={['guide', 'disciplines', 'consistency']}
          />
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
                <td className="p-4 font-mono">options</td>
                <td className="p-4 font-mono text-muted-foreground">
                  CascaderOption[]
                </td>
                <td className="p-4 font-mono text-muted-foreground">[]</td>
                <td className="p-4">数据源，结构包含 label, value, children</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">value</td>
                <td className="p-4 font-mono text-muted-foreground">T[]</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">当前选中的值（受控）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">defaultValue</td>
                <td className="p-4 font-mono text-muted-foreground">T[]</td>
                <td className="p-4 font-mono text-muted-foreground">[]</td>
                <td className="p-4">默认选中的值（非受控）</td>
              </tr>
              <tr className="border-b">
                <td className="p-4 font-mono">onValueChange</td>
                <td className="p-4 font-mono text-muted-foreground">
                  (value: T[]) =&gt; void
                </td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">选中项变化时的回调</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">placeholder</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">
                  &apos;请选择&apos;
                </td>
                <td className="p-4">占位文本</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
