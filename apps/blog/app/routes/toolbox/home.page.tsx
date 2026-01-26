import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ZView,
} from '@zcat/ui';
import {
  FileJsonIcon,
  FileCode,
  Globe,
  IdCard,
  Image as ImageIcon,
  Key,
} from 'lucide-react';
import { Link } from 'react-router';

import { AiChat } from '@blog/features';

export function meta() {
  return [
    { title: '工具箱' },
    {
      name: 'description',
      content: '常用功能入口',
    },
  ];
}

export default function ToolboxHomePage() {
  return (
    <ZView className="h-full">
      <AiChat emptyComponent={EmptyStateComponent} />
    </ZView>
  );
}

const items = [
  {
    title: 'Markdown 转 HTML',
    description: '将 Markdown 转换为 HTML 源码，支持 GFM 和数学公式。',
    to: '/toolbox/markdown-to-html',
    Icon: FileCode,
  },
  {
    title: 'IP 查询',
    description: '查询当前网络 IP 地址及归属地信息。',
    to: '/toolbox/ip-lookup',
    Icon: Globe,
  },
  {
    title: 'RSA 加解密',
    description: '在线生成 RSA 密钥对，进行公钥加密和私钥解密。',
    to: '/toolbox/rsa-crypto',
    Icon: Key,
  },
  {
    title: '图片和 Base64 互转',
    description: '将图片转换为 Base64，或将 Base64 还原为图片。',
    to: '/toolbox/base64-to-image',
    Icon: ImageIcon,
  },
  {
    title: '身份证生成',
    description: '生成符合规则的身份证信息，用于测试与演示场景。',
    to: '/toolbox/id-card-generator',
    Icon: IdCard,
  },
  {
    title: 'JSON 查看器',
    description: '在线查看和格式化 JSON 数据，方便调试与分析。',
    to: '/toolbox/json-viewer',
    Icon: FileJsonIcon,
  },
] as const;

const EmptyStateComponent = () => (
  <ZView className="p-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
    {items.map((item) => (
      <Link
        key={item.to}
        to={item.to}
        className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <Card className="h-full transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
            <CardAction>
              <item.Icon className="text-muted-foreground size-5" />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ZView className="text-muted-foreground text-sm">立即使用</ZView>
          </CardContent>
        </Card>
      </Link>
    ))}
  </ZView>
);
