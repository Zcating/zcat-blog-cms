import { ZButton } from '@zcat/ui';
import { FileQuestion, Home } from 'lucide-react';
import { Link } from '@tanstack/react-router';

export function RouteErrorPage() {
  return (
    <main
      role="alert"
      aria-live="polite"
      className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center p-4"
    >
      <FileQuestion
        className="w-16 h-16 text-muted-foreground"
        aria-hidden="true"
      />
      <div>
        <h1 className="text-3xl font-bold">404 - 页面未找到</h1>
        <p className="text-muted-foreground mt-2 max-w-md">
          您访问的页面不存在或已被移除。
        </p>
      </div>
      <Link to="/dashboard">
        <ZButton>
          <Home className="w-4 h-4 mr-2" />
          返回首页
        </ZButton>
      </Link>
    </main>
  );
}
