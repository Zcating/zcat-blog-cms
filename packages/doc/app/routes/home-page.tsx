import { ZButton } from '@zcat/ui';
import type { Route } from './+types/home-page';
import { Link } from 'react-router';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Introduction - @zcat/ui' },
    {
      name: 'description',
      content: 'Documentation for @zcat/ui component library',
    },
  ];
}

export default function Home() {
  return (
    <div className="max-w-3xl space-y-8">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">@zcat/ui</h1>
        <p className="text-xl text-muted-foreground">
          基于 Radix UI 和 Tailwind CSS 构建的现代化 React 组件库。
          专注于提供高质量、可访问且易于定制的 UI 组件，帮助开发者快速构建美观的
          Web 应用。
        </p>
        <div className="flex gap-4">
          <Link to="/button">
            <ZButton size="lg">开始使用</ZButton>
          </Link>
          <ZButton variant="outline" size="lg" asChild>
            <a
              href="https://github.com/your-repo/zcat-ui"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
          </ZButton>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3 pt-8">
        <div className="space-y-2">
          <h3 className="font-bold text-lg">可定制</h3>
          <p className="text-sm text-muted-foreground">
            基于 Tailwind CSS，样式完全可控，轻松适配您的品牌设计风格。
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">无障碍</h3>
          <p className="text-sm text-muted-foreground">
            遵循 WAI-ARIA 标准，确保所有用户都能顺畅使用您的应用。
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="font-bold text-lg">现代化</h3>
          <p className="text-sm text-muted-foreground">
            精心设计的交互和视觉效果，提供一流的用户体验。
          </p>
        </div>
      </div>
    </div>
  );
}
