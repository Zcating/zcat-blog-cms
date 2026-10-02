import { ZButton, ZView } from '@zcat/ui';
import { FileQuestion, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function NotFoundPage() {
  return (
    <ZView className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
      <FileQuestion
        className="w-16 h-16 text-muted-foreground"
        aria-hidden="true"
      />
      <h1 className="text-3xl font-bold">页面未找到</h1>
      <p className="text-muted-foreground max-w-md">
        您访问的页面可能已被删除、重命名或暂时不可用。
      </p>
      <Link to="/dashboard" role="button">
        <ZButton>
          <Home className="w-4 h-4 mr-2" />
          返回首页
        </ZButton>
      </Link>
    </ZView>
  );
}
