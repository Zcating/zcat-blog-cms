import {
  Button,
  Card,
  CardContent,
  ZButton,
  ZCheckbox,
  ZDialog,
  ZGrid,
  ZImage,
  ZImagePreload,
  cn,
} from '@zcat/ui';
import { Maximize2 } from 'lucide-react';
import React from 'react';

import type { PhotosApi } from '@cms/api';

interface PhotoSelectorProps {
  /** 照片列表 */
  photos: PhotosApi.Photo[];
  /** 选择模式 */
  mode?: 'single' | 'multiple';
  /** 已选择的照片ID列表 */
  selectedIds?: number[];
  /** 选择变化回调 */
  onSelectionChange?: (selectedIds: number[]) => void;
  /** 确认选择回调 */
  onConfirm?: (selectedPhotos: PhotosApi.Photo[]) => void;
  /** 取消回调 */
  onCancel?: () => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
  /** 自定义类名 */
  className?: string;
}

/**
 * 照片选择器
 * @param props
 * @returns
 */
export function PhotoSelector(props: PhotoSelectorProps) {
  const {
    photos,
    mode = 'multiple',
    selectedIds = [],
    onSelectionChange,
    onConfirm,
    onCancel,
    showActions = true,
    className = '',
  } = props;

  const [internalSelectedIds, setInternalSelectedIds] =
    React.useState<number[]>(selectedIds);

  // 处理照片选择
  const handlePhotoSelect = (photoId: number, selected: boolean) => {
    let newSelectedIds: number[];

    if (mode === 'single') {
      newSelectedIds = selected ? [photoId] : [];
    } else {
      if (selected) {
        newSelectedIds = [...internalSelectedIds, photoId];
      } else {
        newSelectedIds = internalSelectedIds.filter((id) => id !== photoId);
      }
    }

    setInternalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    if (mode === 'single') return;

    const allSelected = internalSelectedIds.length === photos.length;
    const newSelectedIds = allSelected ? [] : photos.map((photo) => photo.id);

    setInternalSelectedIds(newSelectedIds);
    onSelectionChange?.(newSelectedIds);
  };

  // 确认选择
  const handleConfirm = () => {
    const selectedPhotos = photos.filter((photo) =>
      internalSelectedIds.includes(photo.id),
    );
    onConfirm?.(selectedPhotos);
  };

  // 全屏预览
  const handleFullscreen = async (photo: PhotosApi.Photo) => {
    await ZDialog.show({
      contentContainerClassName:
        'p-2 w-full max-w-3xl sm:max-w-3xl min-h-[50vh] max-h-[80vh] overflow-hidden',
      content: (
        <div className="h-full w-full flex items-center justify-center overflow-auto">
          <ZImage
            className="w-full h-full"
            src={photo.url}
            alt={photo.name}
            contentMode="contain"
          />
        </div>
      ),
    });
  };

  const allSelected =
    mode === 'multiple' && internalSelectedIds.length === photos.length;
  const hasSelection = internalSelectedIds.length > 0;

  return (
    <div className={cn('flex flex-col gap-4 h-full', className)}>
      {/* 操作栏 */}
      {showActions && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'multiple' && (
              <ZButton variant="outline" size="sm" onClick={handleSelectAll}>
                {allSelected ? '取消全选' : '全选'}
              </ZButton>
            )}
            <span className="text-sm text-gray-600">
              {mode === 'single'
                ? `已选择 ${internalSelectedIds.length} 张照片`
                : `已选择 ${internalSelectedIds.length}/${photos.length} 张照片`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <ZButton variant="outline" onClick={onCancel}>
                取消
              </ZButton>
            )}
            {onConfirm && (
              <ZButton onClick={handleConfirm} disabled={!hasSelection}>
                确认选择
              </ZButton>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        {/* 照片网格 */}
        {photos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>暂无照片</p>
          </div>
        ) : (
          <ZGrid
            cols={5}
            rowGap="md"
            columnGap="md"
            items={photos}
            columnClassName="px-0"
            rowClassName="p-1"
            renderItem={(photo) => (
              <PhotoSelectorCard
                key={photo.id}
                photo={photo}
                selected={internalSelectedIds.includes(photo.id)}
                onSelect={(selected) => handlePhotoSelect(photo.id, selected)}
                onFullscreen={() => handleFullscreen(photo)}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}

// 照片选择卡片组件
interface PhotoSelectorCardProps {
  photo: PhotosApi.Photo;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onFullscreen: () => void;
}

function PhotoSelectorCard(props: PhotoSelectorCardProps) {
  const { photo, selected, onSelect, onFullscreen } = props;
  const [isHovered, setIsHovered] = React.useState(false);
  const className = cn(
    'relative cursor-pointer transition-all duration-200',
    selected ? 'ring-2 ring-blue-500 ring-offset-2' : '',
  );
  return (
    <Card
      className={cn('p-0 gap-0 overflow-hidden', className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(!selected)}
    >
      <div className="aspect-4/3 bg-gray-200">
        <ZImagePreload
          className="w-full h-full"
          src={photo.thumbnailUrl}
          alt={photo.name}
          contentMode="scale-down"
        />
      </div>

      {/* 选择状态指示器 */}
      <div className="absolute top-2 left-2">
        <ZCheckbox value={selected} onValueChange={onSelect} />
      </div>

      {/* 悬停操作按钮 */}
      {isHovered && (
        <div className="absolute top-2 right-2">
          <ZButton
            variant="secondary"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
          >
            <Maximize2 className="size-5" />
          </ZButton>
        </div>
      )}

      {/* 照片名称 */}
      <CardContent className="p-2">
        <div className="text-sm truncate font-medium">{photo.name}</div>
      </CardContent>
    </Card>
  );
}

// 照片选择器弹窗组件
interface PhotoSelectorModalProps extends Omit<
  PhotoSelectorProps,
  'showActions'
> {}

/**
 * 照片选择器弹窗组件
 * @param props
 * @returns
 */
export async function showPhotoSelector(props: PhotoSelectorModalProps) {
  const resolvers = Promise.withResolvers<PhotosApi.Photo[]>();
  let settled = false;
  const safeResolve = (value: PhotosApi.Photo[]) => {
    if (settled) return;
    settled = true;
    resolvers.resolve(value);
  };

  await ZDialog.show({
    title: '选择照片',
    contentContainerClassName:
      'p-4 h-[70vh] w-[70vw] max-w-[calc(100%-2rem)] sm:max-w-[70vw] flex flex-col overflow-hidden',
    content: ({ onClose }) => (
      <PhotoSelector
        {...props}
        className="flex-1 overflow-auto"
        onConfirm={(selected) => {
          safeResolve(selected);
          onClose();
        }}
        onCancel={() => {
          safeResolve([]);
          onClose();
        }}
        showActions={true}
      />
    ),
    onClose: () => safeResolve([]),
  });

  return resolvers.promise;
}
