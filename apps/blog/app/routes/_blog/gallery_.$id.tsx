import { ZButton, ZView } from '@zcat/ui';
import { createFileRoute, notFound } from '@tanstack/react-router';

import { GalleryDetailPage } from '@blog/features';
import { getGalleryDetail } from '@blog/server/gallery';
import {
  GetGalleryDetailInputSchema,
  type GalleryDetail,
} from '@blog/server/gallery/schemas';
import { isNotFoundError } from '@blog/server/errors';

interface GalleryDetailLoaderArgs {
  params: { id?: string };
}

export async function loader({ params }: GalleryDetailLoaderArgs) {
  const id = params.id ?? '';

  if (!GetGalleryDetailInputSchema.safeParse({ id }).success) {
    throw notFound();
  }

  let gallery: GalleryDetail;

  try {
    gallery = await getGalleryDetail({ data: { id } });
  } catch (error) {
    if (isNotFoundError(error)) {
      throw notFound();
    }
    throw error;
  }

  return { gallery };
}

export const Route = createFileRoute('/_blog/gallery_/$id')({
  head: () => ({
    meta: [{ title: '相册' }, { name: 'description', content: '个人技术博客' }],
  }),
  loader: ({ params }) => loader({ params }),
  component: GalleryDetailPage,
  notFoundComponent: () => <GalleryDetailNotFound />,
  errorComponent: () => <GalleryDetailNotFound />,
});

function GalleryDetailNotFound() {
  return (
    <ZView className="container mx-auto py-12 text-center space-y-4">
      <h1 className="text-3xl font-bold">相册不存在</h1>
      <p className="text-muted-foreground">
        您访问的相册可能已被删除或暂时不可用。
      </p>
      <ZButton onClick={() => (window.location.href = '/gallery')}>
        返回相册列表
      </ZButton>
    </ZView>
  );
}
