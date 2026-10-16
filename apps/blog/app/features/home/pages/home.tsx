import {
  Card,
  StaggerReveal,
  ZImagePreload,
  ZView,
  ZWaterfall,
} from '@zcat/ui';
import { Link, getRouteApi } from '@tanstack/react-router';

import { PostExcerptCard } from '@blog/features/posts';

import type { PhotoFeedItem } from '@blog/server/photo/schemas';

import { Hero } from '../components';
import type { HomeGridItem } from '../home-grid';

const routeApi = getRouteApi('/_blog/');

export function HomePage() {
  const { userInfo, items } = routeApi.useLoaderData();

  return (
    <ZView className="flex flex-col gap-5 px-4 md:px-10">
      <Hero userInfo={userInfo} />
      <StaggerReveal
        selector='[data-home-grid-item="true"]'
        direction="bottom"
        dependencies={[items]}
      >
        <ZWaterfall
          data={items}
          columnCount={4}
          columnCountConfig={{ sm: 2, lg: 3 }}
          renderItem={(item) => <HomeGridItemCard item={item} />}
        />
      </StaggerReveal>
    </ZView>
  );
}

function HomeGridItemCard({ item }: { item: HomeGridItem }) {
  if (item.kind === 'photo') {
    return <PhotoCard photo={item.photo} />;
  }
  return (
    <Link
      to="/post-board/$id"
      params={{ id: String(item.article.id) }}
      preload="intent"
      className="block"
    >
      <PostExcerptCard value={item.article} />
    </Link>
  );
}

function PhotoCard({ photo }: { photo: PhotoFeedItem }) {
  return (
    <Link
      to="/gallery/$id"
      params={{ id: String(photo.albumId) }}
      preload="intent"
      className="block"
    >
      <Card
        data-home-grid-item="true"
        className="group relative p-0! overflow-hidden"
      >
        <ZImagePreload src={photo.signedThumbnailUrl} />
        <ZView className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <p className="text-xl font-bold text-white text-center px-4">
            {photo.name}
          </p>
          <p className="text-sm text-white/80">{photo.albumName}</p>
        </ZView>
      </Card>
    </Link>
  );
}
