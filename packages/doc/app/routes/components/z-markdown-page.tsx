import { ZMarkdown } from '@zcat/ui';

import type { Route } from '../+types/home-page';

export function meta(_: Route.MetaArgs) {
  return [
    { title: 'Markdown - @zcat/ui' },
    { name: 'description', content: 'Markdown component documentation' },
  ];
}

const exampleContent = `
# Markdown 标题

这是一个段落。支持 **加粗**、*斜体* 和 ~~删除线~~。

# 一级标题
## 二级标题
### 三级标题
#### 四级标题
##### 五级标题

## Lorem ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.

## 列表

- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2

## 代码块

\`\`\`typescript 
import path from "path";
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
                <td className="p-4 font-mono">content</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">Markdown 文本内容</td>
              </tr>
              <tr>
                <td className="p-4 font-mono">className</td>
                <td className="p-4 font-mono text-muted-foreground">string</td>
                <td className="p-4 font-mono text-muted-foreground">-</td>
                <td className="p-4">自定义类名</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
