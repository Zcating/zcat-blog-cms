import { type ReactNode } from 'react';

export interface ApiItem {
  attribute: string;
  type: string | ReactNode;
  default: string | ReactNode;
  description: string | ReactNode;
}

export interface ApiTableProps {
  data: ApiItem[];
  title?: string;
  headers?: [string, string, string, string];
}

export function ApiTable({
  data,
  title = 'API 参考',
  headers = ['属性', '类型', '默认值', '说明'],
}: ApiTableProps) {
  return (
    <div className="space-y-6">
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              {headers.map((header, index) => (
                <th key={index} className="h-10 px-4 text-left font-medium">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr key={index} className="border-b last:border-0">
                <td className="p-4 font-mono">{item.attribute}</td>
                <td className="p-4 font-mono text-muted-foreground">
                  {item.type}
                </td>
                <td className="p-4 font-mono text-muted-foreground">
                  {item.default}
                </td>
                <td className="p-4">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
