import * as ZcatUi from '@zcat/ui';
import { Code, Copy, Eye, Check, ShieldAlert } from 'lucide-react';
import React from 'react';

interface ZExecutableCodeProps {
  children?: React.ReactNode;
  language?: string;
  className?: string;
}

/**
 * 文档站可执行代码块。
 *
 * 早期版本使用 `new Function` + sucrase 动态执行用户 Markdown 中的代码，存在
 * XSS / 原型污染风险。新版改为：preview 窗格展示代码 + 安全提示，**不执行**。
 * 用户在自己项目里 import 实际组件以验证行为。
 */
function ExecutablePreview({ code }: { code: string }) {
  // 用 iframe sandbox 隔离渲染，避免主页面被任何潜在脚本污染
  const html = React.useMemo(() => {
    const escaped = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    return `<!doctype html>
<html><head><meta charset="utf-8" /><style>
  body { margin: 0; padding: 16px; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.5; background: #0a0a0a; color: #fafafa; }
  pre { margin: 0; white-space: pre-wrap; word-break: break-all; }
  .notice { background: #1f1f1f; color: #fbbf24; padding: 8px 12px; border-radius: 6px; margin-bottom: 12px; border: 1px solid #444; }
</style></head>
<body>
  <div class="notice">⚠️ 出于安全考虑，代码示例不在文档站执行。请把代码粘到你的项目里验证。</div>
  <pre>${escaped}</pre>
</body></html>`;
  }, [code]);

  return (
    <iframe
      title="代码预览（仅展示）"
      srcDoc={html}
      sandbox=""
      className="w-full min-h-[200px] border-0 rounded-md"
    />
  );
}

type ViewMode = 'code' | 'preview';
const VIEW_MODE_OPTIONS: CommonOption<ViewMode>[] = [
  {
    value: 'code',
    label: (
      <>
        <Code size={14} />
        代码
      </>
    ),
  },
  {
    value: 'preview',
    label: (
      <>
        <Eye size={14} />
        预览
      </>
    ),
  },
];

export function ExecutableCodeBlock({
  children,
  className,
}: ZExecutableCodeProps) {
  const [isCollapsed, onToggleCollapsed] = ZcatUi.useToggleValue(false);
  const [viewMode, setViewMode] = React.useState<ViewMode>('preview');
  const [isCopied, setIsCopied] = React.useState(false);
  const code = ZcatUi.safeString(children);

  const handleViewChange = ZcatUi.useMemoizedFn((value: string) => {
    const option = VIEW_MODE_OPTIONS.find((item) => item.value === value);
    if (!option) {
      return;
    }
    setViewMode(option.value);
  });

  const handleCopy = ZcatUi.useMemoizedFn(async () => {
    await navigator.clipboard.writeText(code);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  });

  return (
    <ZcatUi.Card className={ZcatUi.cn('py-0 gap-0', className)}>
      <ZcatUi.CardHeader className="flex items-center bg-accent/50 justify-between px-4 py-2">
        <ZcatUi.CardTitle className="text-markdown-code-lang">
          typescript
        </ZcatUi.CardTitle>
        <ZcatUi.CardAction className="flex items-center gap-3">
          <ZcatUi.ZToggleGroup
            type="single"
            value={viewMode}
            onValueChange={handleViewChange}
            options={VIEW_MODE_OPTIONS}
          />
          <ZcatUi.Button size="sm" variant="outline" onClick={handleCopy}>
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
          </ZcatUi.Button>
          <ZcatUi.Button
            size="sm"
            variant="outline"
            onClick={onToggleCollapsed}
          >
            {isCollapsed ? '展开' : '折叠'}
          </ZcatUi.Button>
        </ZcatUi.CardAction>
      </ZcatUi.CardHeader>
      <ZcatUi.CardContent className="py-3">
        <ZcatUi.FoldAnimation isOpen={!isCollapsed}>
          <div className={viewMode === 'code' ? 'hidden' : 'block'}>
            <ExecutablePreview code={code} />
          </div>
          <div className={viewMode === 'code' ? 'block' : 'hidden'}>
            <ZcatUi.ZSyntaxHighlighter language="tsx">
              {code}
            </ZcatUi.ZSyntaxHighlighter>
          </div>
        </ZcatUi.FoldAnimation>
      </ZcatUi.CardContent>
    </ZcatUi.Card>
  );
}
