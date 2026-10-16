import { ZView } from '@zcat/ui';
import { getRouteApi } from '@tanstack/react-router';

import { PostContentView } from '../components/post-content-view';

const routeApi = getRouteApi('/_blog/post-board_/$id');

export function PostBoardDetailPage() {
  const { article, jsonLd } = routeApi.useLoaderData();
  return (
    <ZView>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PostContentView value={article} />
    </ZView>
  );
}
