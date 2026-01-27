import { useConstant, ZMarkdown } from '@zcat/ui';

import { ExecutableCodeBlock } from '~/features';

export function meta() {
  return [
    { title: 'Cascader - @zcat/ui' },
    { name: 'description', content: 'Cascader component documentation' },
  ];
}

const exampleContent = `
# Cascader 级联选择

级联选择框。用于从一组相关联的数据集合中进行选择，例如省市区，公司层级，事物分类等。

## Basic Usage

\`\`\`typescript-demo
import { ZCascader } from '@zcat/ui';

const options = [
  {
    value: 'guide',
    label: 'Guide',
    children: [
      {
        value: 'disciplines',
        label: 'Disciplines',
        children: [
          { value: 'consistency', label: 'Consistency' },
          { value: 'feedback', label: 'Feedback' },
          { value: 'efficiency', label: 'Efficiency' },
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
          { value: 'button', label: 'Button' },
          { value: 'input', label: 'Input' },
        ],
      },
    ],
  },
];

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZCascader options={options} placeholder="Please select" />
    </div>
  );
}
\`\`\`

## Default Value

\`\`\`typescript-demo
import { ZCascader } from '@zcat/ui';

const options = [
  {
    value: 'guide',
    label: 'Guide',
    children: [
      {
        value: 'disciplines',
        label: 'Disciplines',
        children: [
          { value: 'consistency', label: 'Consistency' },
        ],
      },
    ],
  },
];

export function DemoComponent() {
  return (
    <div className="flex flex-wrap gap-4">
      <ZCascader
        options={options}
        defaultValue={['guide', 'disciplines', 'consistency']}
      />
    </div>
  );
}
\`\`\`

## API

| Attribute | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| options | CascaderOption[] | [] | 数据源，结构包含 label, value, children |
| value | T[] | - | 当前选中的值（受控） |
| defaultValue | T[] | [] | 默认选中的值（非受控） |
| onValueChange | (value: T[]) => void | - | 选中项变化时的回调 |
| placeholder | string | '请选择' | 占位文本 |
`;

export default function CascaderPage() {
  return (
    <ZMarkdown
      className="pb-40"
      content={exampleContent}
      customCodeComponents={useConstant(() => ({
        'typescript-demo': ExecutableCodeBlock,
      }))}
    />
  );
}
