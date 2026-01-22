import {
  ZButton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  ZTextarea,
  ZView,
  ZTree,
  type CascaderOption,
  ZMessage,
} from '@zcat/ui';
import { ArrowRight, Braces, FileJson } from 'lucide-react';
import { useState } from 'react';

export function meta() {
  return [
    { title: 'JSON 结构化工具' },
    {
      name: 'description',
      content: '在线 JSON 解析与结构化查看工具',
    },
  ];
}

// 辅助函数：将任意 JSON 数据转换为 CascaderOption[]
const jsonToTreeOptions = (data: any, path = 'root'): CascaderOption[] => {
  const result: CascaderOption[] = [];
  const stack = [{ data, path, container: result }];

  // 初始处理：如果根节点是 primitive/null，直接返回
  if (data === null) {
    return [{ label: 'null', value: path }];
  }
  if (typeof data !== 'object') {
    return [{ label: String(data), value: path }];
  }

  while (stack.length > 0) {
    const { data: currentData, path: currentPath, container } = stack.pop()!;

    if (Array.isArray(currentData)) {
      // 遍历数组，处理每一项
      currentData.forEach((item, index) => {
        const itemPath = `${currentPath}.${index}`;
        const isPrimitive = item === null || typeof item !== 'object';

        if (isPrimitive) {
          container.push({
            label: `${index}: ${String(item as string | number | boolean | null)}`,
            value: itemPath,
          });
        } else {
          const newContainer: CascaderOption[] = [];
          container.push({
            label: `[${index}] ${Array.isArray(item) ? `Array(${item.length})` : 'Object'}`,
            value: itemPath,
            children: newContainer,
          });
          // 将子项压入栈中待处理
          stack.push({
            data: item,
            path: itemPath,
            container: newContainer,
          });
        }
      });
    } else {
      // 处理对象
      Object.entries(currentData).forEach(([key, value]) => {
        const itemPath = `${currentPath}.${key}`;
        const isPrimitive = value === null || typeof value !== 'object';

        if (isPrimitive) {
          container.push({
            label: `${key}: ${String(value as string | number | boolean | null)}`,
            value: itemPath,
          });
        } else {
          const newContainer: CascaderOption[] = [];
          container.push({
            label: key,
            value: itemPath,
            children: newContainer,
          });
          // 将子项压入栈中待处理
          stack.push({
            data: value,
            path: itemPath,
            container: newContainer,
          });
        }
      });
    }
  }

  return result;
};

export default function JsonViewerPage() {
  const [inputJson, setInputJson] = useState('');
  const [treeData, setTreeData] = useState<CascaderOption[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFormat = () => {
    if (!inputJson.trim()) {
      setTreeData([]);
      setError(null);
      return;
    }

    try {
      const parsed = JSON.parse(inputJson);
      const options = jsonToTreeOptions(parsed);
      setTreeData(options);
      setError(null);
      ZMessage.success('JSON 解析成功');
    } catch (e) {
      console.error(e);
      setError((e as Error).message);
      setTreeData([]);
      ZMessage.error('JSON 格式错误');
    }
  };

  return (
    <ZView className="p-4 space-y-6 h-full w-full flex flex-col">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">JSON 结构化查看</h1>
        <p className="text-sm text-muted-foreground">
          输入 JSON 字符串，将其转换为可视化的树形结构，方便阅读和分析。
        </p>
      </div>

      <div className="flex-1 flex gap-6 min-h-0">
        {/* 左侧：输入区 */}
        <Card className="flex-1 flex flex-col h-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5" />
              JSON 输入
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <ZTextarea
              className="flex-1 font-mono text-sm resize-none"
              style={{ fieldSizing: 'fixed' } as React.CSSProperties}
              value={inputJson}
              onValueChange={setInputJson}
              placeholder="请在此粘贴 JSON 内容..."
            />
            {error && (
              <div className="text-destructive text-sm bg-destructive/10 p-2 rounded">
                解析错误: {error}
              </div>
            )}
            <ZButton
              className="w-full"
              onClick={handleFormat}
              disabled={!inputJson}
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              解析与格式化
            </ZButton>
          </CardContent>
        </Card>

        {/* 右侧：结果区 */}
        <Card className="flex-1 flex flex-col h-full min-w-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Braces className="w-5 h-5" />
              结构化视图
            </CardTitle>
          </CardHeader>
          <CardContent className="w-full flex-1 flex flex-col min-h-0">
            <ZView className="flex-1 overflow-auto border rounded-md p-2">
              {treeData.length > 0 ? (
                <ZTree options={treeData} defaultExpandAll={true} />
              ) : (
                <ZView className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  暂无数据，请在左侧输入并解析
                </ZView>
              )}
            </ZView>
          </CardContent>
        </Card>
      </div>
    </ZView>
  );
}
