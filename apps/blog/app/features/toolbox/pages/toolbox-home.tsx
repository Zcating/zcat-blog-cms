import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ZView,
} from '@zcat/ui';
import { Link } from '@tanstack/react-router';

import { TOOL_REGISTRY } from '../lib';

export function ToolboxHomePage() {
  return (
    <ZView className="p-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {TOOL_REGISTRY.map((tool) => (
        <Link
          key={tool.path}
          to={tool.path as never}
          className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{tool.name}</CardTitle>
              <CardDescription>{tool.description}</CardDescription>
              <CardAction>
                <tool.Icon className="text-muted-foreground size-5" />
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
}
