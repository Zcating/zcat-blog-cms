import { ArticlesApi } from '@cms/api';
import type { Route } from './+types/dashboard';

export async function clientLoader() {
  return {
    // articles: await ArticlesApi.getArticles(),
  };
}

export default function Dashboard(props: Route.ComponentProps) {
  return <div className="space-y-2">欢迎回来</div>;
}
