import { ZMarkdown } from '@zcat/ui';

export function meta({}: any) {
  return [
    { title: 'Markdown - @zcat/ui' },
    { name: 'description', content: 'Markdown component documentation' },
  ];
}

const exampleContent = `
# Markdown 标题

这是一个段落。支持 **加粗**、*斜体* 和 ~~删除线~~。

## 列表

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

## 代码块

\`\`\`typescript
const greeting = "Hello, World!";
console.log(greeting);
\`\`\`

## 引用

> 这是一个引用块。
> 可以包含多行。

## 表格

| 标题 1 | 标题 2 |
| ------ | ------ |
| 内容 1 | 内容 2 |
| 内容 3 | 内容 4 |

## 数学公式 (KaTeX)

行内公式：$E = mc^2$

块级公式：

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

## 链接

[ZCat UI](https://github.com/zcat-ui)
`;

export default function ZMarkdownPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Markdown</h1>
        <p className="text-muted-foreground">
          基于 React Markdown 的渲染组件，支持代码高亮、数学公式等。
        </p>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold tracking-tight">示例</h2>
        <div className="border rounded-lg p-6 bg-card">
          <ZMarkdown content={exampleContent} />
        </div>
      </div>
    </div>
  );
}
