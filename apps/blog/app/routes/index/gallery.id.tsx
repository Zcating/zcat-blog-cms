import { Button, IconClose, ZDialog, ZImage, ZView } from '@zcat/ui';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

import { GalleryApi } from '@blog/apis';
import { ImageZoomViewer, PhotoPoster } from '@blog/features';

import type { Route } from '../index/+types/gallery.id';

export function meta() {
  return [{ title: '相册' }, { name: 'description', content: '个人技术博客' }];
}

export async function loader({ params }: Route.LoaderArgs) {
  const gallery = await GalleryApi.getGalleryDetail(params.id);
  return {
    gallery,
  };
}

export default function GalleryDetailPage(props: Route.ComponentProps) {
  const { gallery } = props.loaderData;
  const navigate = useNavigate();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // 构造统一的展示列表
  const items = useMemo(() => {
    const list: Array<{
      id: string;
      url: string;
      name?: string;
      description?: string;
      isCover?: boolean;
      original?: any;
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
        id: photo.id,
        url: photo.url,
        name: photo.name,
        description: '', // 照片描述暂时为空，如果有字段可以加上
        isCover: false,
        original: photo,
      });
    });

    return list;
  }, [gallery]);

  const currentItem = items[selectedIndex];

  // 键盘导航
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
    navigate(`/gallery`);
  };

  const handleMainImageClick = () => {
    ZDialog.show({
      showCloseButton: false,
      contentContainerClassName:
        '!max-w-screen h-screen w-screen p-0 bg-black/95 border-none flex items-center justify-center',
      content: ({ onClose }) => (
        <ZView>
          <ImageZoomViewer
            className="py-40 px-20"
            src={currentItem.url}
            alt={currentItem.name}
          />
          <Button
            className="absolute top-4 right-4 z-50 hover:bg-white/20"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <IconClose className="text-white" />
          </Button>
        </ZView>
      ),
    });
  };

  if (!currentItem) {
    return null; // 或者显示 Loading
  }

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
            onClick={handleMainImageClick}
            className="cursor-pointer w-full h-full flex items-center justify-center"
          >
            <ZImage
              src={currentItem.url}
              alt={currentItem.name || 'Photo'}
              className="shadow-lg"
              contentMode="contain"
            />
          </div>
        </ZView>

        {/* 缩略图区域 */}
        <ZView className="h-24 w-full bg-black/80 flex items-center px-4 gap-2 overflow-x-auto border-t border-white/10 shrink-0">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setSelectedIndex(index)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-all ${
                selectedIndex === index
                  ? 'ring-2 ring-primary opacity-100'
                  : 'opacity-50 hover:opacity-80'
              }`}
            >
              <ZImage
                src={item.url}
                alt={item.name}
                className="h-full w-full object-cover"
                contentMode="cover"
              />
            </button>
          ))}
        </ZView>
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
        <ZView className="p-4 border-t bg-muted/20">
          <ZView className="flex justify-between items-center">
            <Button
              variant="outline"
              size="icon"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedIndex((prev) => prev - 1)}
            >
              <ArrowLeft className="size-4" />
            </Button>
            <span className="text-sm text-muted-foreground">导航</span>
            <Button
              variant="outline"
              size="icon"
              disabled={selectedIndex === items.length - 1}
              onClick={() => setSelectedIndex((prev) => prev + 1)}
            >
              <ArrowRight className="size-4" />
            </Button>
          </ZView>
        </ZView>
      </ZView>
    </ZView>
  );
}
