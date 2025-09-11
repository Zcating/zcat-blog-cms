import type { PhotosApi } from '@cms/api';
import { Button, Card, Checkbox, Image, Modal, Row } from '@cms/components';
import { FullscreenOutlined } from '@ant-design/icons';
import React from 'react';

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
    await Modal.open({
      contentContainerClassName: 'min-h-[50vh] max-h-[80vh] max-w-3xl',
      children: <Image className="w-full" src={photo.url} alt={photo.name} />,
      backdropClose: true,
    });
  };

  const allSelected =
    mode === 'multiple' && internalSelectedIds.length === photos.length;
  const hasSelection = internalSelectedIds.length > 0;

  return (
    <div className={className}>
      {/* 操作栏 */}
      {showActions && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'multiple' && (
              <Button variant="accent" size="sm" onClick={handleSelectAll}>
                {allSelected ? '取消全选' : '全选'}
              </Button>
            )}
            <span className="text-sm text-gray-600">
              {mode === 'single'
                ? `已选择 ${internalSelectedIds.length} 张照片`
                : `已选择 ${internalSelectedIds.length}/${photos.length} 张照片`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <Button variant="accent" onClick={onCancel}>
                取消
              </Button>
            )}
            {onConfirm && (
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={!hasSelection}
              >
                确认选择
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 照片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-2">
        {photos.map((photo) => (
          <PhotoSelectorCard
            key={photo.id}
            photo={photo}
            selected={internalSelectedIds.includes(photo.id)}
            onSelect={(selected) => handlePhotoSelect(photo.id, selected)}
            onFullscreen={() => handleFullscreen(photo)}
          />
        ))}
      </div>

      {/* 空状态 */}
      {photos.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>暂无照片</p>
        </div>
      )}
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

  return (
    <Card
      className={`relative cursor-pointer transition-all duration-200 ${
        selected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(!selected)}
    >
      <Card.Figure src={photo.thumbnailUrl} alt={photo.name} />

      {/* 选择状态指示器 */}
      <div className="absolute top-2 left-2">
        <Checkbox value={selected} onChange={onSelect} variant="primary" />
      </div>

      {/* 悬停操作按钮 */}
      {isHovered && (
        <div className="absolute top-2 right-2">
          <Button
            variant="info"
            shape="square"
            size="sm"
            appearance="soft"
            onClick={(e) => {
              e.stopPropagation();
              onFullscreen();
            }}
          >
            <FullscreenOutlined className="text-xl" />
          </Button>
        </div>
      )}

      {/* 照片名称 */}
      <Card.Body className="p-2">
        <Card.Title className="text-sm truncate">{photo.name}</Card.Title>
      </Card.Body>
    </Card>
  );
}

// 照片选择器弹窗组件
interface PhotoSelectorModalProps
  extends Omit<PhotoSelectorProps, 'showActions'> {}

export async function showPhotoSelector(props: PhotoSelectorModalProps) {
  return Modal.open<PhotosApi.Photo[]>((resolve) => ({
    contentContainerClassName: 'min-h-[70vh] min-w-[70vw]',
    children: (
      <div className="space-y-5">
        <h2 className="text-xl font-semibold mb-4">选择照片</h2>
        <div className="max-h-[60vh] overflow-y-auto">
          <PhotoSelector
            {...props}
            onConfirm={resolve}
            onCancel={() => resolve([])}
            showActions={true}
          />
        </div>
      </div>
    ),
  }));
}
