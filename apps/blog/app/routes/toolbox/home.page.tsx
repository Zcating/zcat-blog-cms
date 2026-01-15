import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ZView,
} from '@zcat/ui';
import { IdCard, Image as ImageIcon } from 'lucide-react';
import { Link } from 'react-router';

export default function ToolboxHomePage() {
  // const [value, setValue] = React.useState("");

  const items = [
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
  ] as const;

  return (
    <ZView className="h-full p-4 space-y-6">
      <ZView className="space-y-1">
        <h1 className="text-2xl font-bold">工具箱</h1>
        <p className="text-muted-foreground text-sm">常用功能入口</p>
      </ZView>

      <ZView className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <ZView className="text-muted-foreground text-sm">
                  立即使用
                </ZView>
              </CardContent>
            </Card>
          </Link>
        ))}
      </ZView>
    </ZView>
  );
}
