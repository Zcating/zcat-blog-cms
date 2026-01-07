import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Popover,
  PopoverTrigger,
  ZAvatar,
  ZButton,
} from 'z-ui';
import type { Route } from './+types/home';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'New React Router App' },
    { name: 'description', content: 'Welcome to React Router!' },
  ];
}

import { useState } from 'react';

export default function Home() {
  const [date, setDate] = useState<Date | undefined>(new Date());

  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">z-ui 组件展示</h1>
        <p className="text-muted-foreground">
          这里展示了 z-ui 库中的常用组件。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons 按钮</CardTitle>
            <CardDescription>各种样式的按钮组件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <ZButton>Default</ZButton>
              <ZButton variant="secondary">Secondary</ZButton>
              <ZButton variant="outline">Outline</ZButton>
              <ZButton variant="ghost">Ghost</ZButton>
              <ZButton variant="destructive">Destructive</ZButton>
              <ZButton variant="link">Link</ZButton>
            </div>
            <div className="flex flex-wrap gap-2">
              <ZButton size="sm">Small</ZButton>
              <ZButton size="default">Default</ZButton>
              <ZButton size="lg">Large</ZButton>
              <ZButton size="icon">🔔</ZButton>
            </div>
          </CardContent>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <CardTitle>Inputs 输入框</CardTitle>
            <CardDescription>文本输入和标签</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input type="email" id="email" placeholder="Email" />
            </div>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input type="password" id="password" placeholder="Password" />
            </div>
          </CardContent>
        </Card>

        {/* Avatar */}
        <Card>
          <CardHeader>
            <CardTitle>Avatar 头像</CardTitle>
            <CardDescription>用户头像展示</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <ZAvatar src="https://github.com/shadcn.png" alt="@shadcn" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
