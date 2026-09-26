import { Button, IconClose, ZButton, ZDialog, ZImage, ZView } from '@zcat/ui';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';

import {
  GallerySidebarNav,
  GalleryThumbnailList,
  ImageZoomViewer,
} from '@blog/features';
import { getGalleryDetail } from '@blog/server/gallery';
import { GetGalleryDetailInputSchema } from '@blog/server/gallery/schemas';

interface GalleryDetailLoaderArgs {
  params: { id?: string };
}

export async function loader({ params }: GalleryDetailLoaderArgs) {
  const id = params.id ?? '';

  if (!GetGalleryDetailInputSchema.safeParse({ id }).success) {
    throw notFound();
  }

  const gallery = await getGalleryDetail({ data: { id } });

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

function GalleryDetailPage() {
  const { gallery } = Route.useLoaderData();
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items = useMemo(() => {
    const list: Array<{
      id: string;
      url: string;
      name?: string;
      description?: string;
      isCover?: boolean;
      original?: unknown;
    }> = [];

    if (gallery.cover) {
      list.push({
        id: 'cover',
        url: gallery.cover.url,
        name: gallery.name,
        description: gallery.description,
        isCover: true,
        original: gallery.cover,
      });
    }

    gallery.photos.forEach((photo) => {
      if (gallery.cover && photo.id === gallery.cover.id) {
        return;
      }
      list.push({
        id: String(photo.id),
        url: photo.url,
        name: photo.name,
        description: '',
        isCover: false,
        original: photo,
      });
    });

    return list;
  }, [gallery]);

  const currentItem = items[selectedIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedIndex((prev) => Math.min(items.length - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items.length]);

  const back = () => {
    navigate({ to: '/gallery' });
  };

  if (!currentItem) {
    return null;
  }

  const handleZoom = () => {
    ZDialog.show({
      contentContainerClassName:
        '!max-w-none shadow-none flex items-center justify-center p-0 border-0 bg-transparent',
      showCloseButton: false,
      content: ({ onClose }) => (
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-50"
            onClick={onClose}
          >
            <IconClose />
          </Button>
          <ImageZoomViewer
            src={currentItem.url}
            alt={currentItem.name}
            onClickBackdrop={onClose}
          />
        </div>
      ),
    });
  };

  return (
    <ZView className="flex h-screen w-screen overflow-hidden bg-background">
      {/* 左侧区域：主图 + 缩略图 */}
      <ZView className="flex-1 flex flex-col h-full relative bg-black/95">
        {/* 顶部工具栏 (返回按钮) */}
        <ZView className="absolute top-4 left-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={back}
            className="text-white hover:bg-white/20"
          >
            <IconClose />
          </Button>
        </ZView>

        {/* 主图区域 */}
        <ZView className="flex-1 flex items-center justify-center p-12 overflow-hidden">
          <div
            className="w-full h-full flex items-center justify-center cursor-zoom-in"
            onClick={handleZoom}
          >
            <ZImage
              src={currentItem.url}
              alt={currentItem.name || 'Photo'}
              className="max-w-full max-h-full object-contain shadow-lg pointer-events-none"
              contentMode="contain"
            />
          </div>
        </ZView>

        {/* 缩略图区域 */}
        <GalleryThumbnailList
          items={items}
          value={selectedIndex}
          onValueChange={setSelectedIndex}
        />
      </ZView>

      {/* 右侧侧边栏 */}
      <ZView className="w-[400px] h-full border-l bg-background flex flex-col shadow-xl z-20">
        <ZView className="p-6 flex-1 overflow-y-auto">
          <ZView className="space-y-6">
            <ZView>
              <h1 className="text-2xl font-bold wrap-break-word">
                {currentItem.name || '未命名照片'}
              </h1>
              {currentItem.isCover && (
                <span className="inline-block px-2 py-0.5 text-xs bg-primary/10 text-primary rounded mt-2">
                  封面
                </span>
              )}
            </ZView>

            {currentItem.description && (
              <ZView>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  描述
                </h3>
                <p className="text-base leading-relaxed">
                  {currentItem.description}
                </p>
              </ZView>
            )}

            <ZView>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                信息
              </h3>
              <ZView className="grid grid-cols-2 gap-4 text-sm">
                <ZView>
                  <span className="text-muted-foreground block text-xs">
                    索引
                  </span>
                  <span>
                    {selectedIndex + 1} / {items.length}
                  </span>
                </ZView>
                <ZView>
                  <span className="text-muted-foreground block text-xs">
                    ID
                  </span>
                  <span
                    className="font-mono text-xs truncate block"
                    title={currentItem.id}
                  >
                    {currentItem.id}
                  </span>
                </ZView>
                {/* 这里可以添加更多元数据，比如拍摄时间、相机参数等，如果后端有返回 */}
              </ZView>
            </ZView>
          </ZView>
        </ZView>

        {/* 侧边栏底部操作区 (可选) */}
        <GallerySidebarNav
          value={selectedIndex}
          count={items.length}
          onValueChange={setSelectedIndex}
        />
      </ZView>
    </ZView>
  );
}
