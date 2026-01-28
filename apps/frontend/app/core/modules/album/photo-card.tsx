import { FullscreenOutlined, LoadingOutlined } from '@ant-design/icons';
import {
  Card,
  CardContent,
  CardTitle,
  ZButton,
  ZDialog,
  ZImagePreload,
} from '@zcat/ui';
import React from 'react';

import type { PhotosApi } from '@cms/api';

export interface PhotoCardData extends PhotosApi.Photo {
  loading?: boolean;
}

interface PhotoCardProps {
  data: PhotoCardData;
  onEdit: (data: PhotosApi.Photo) => void;
  onDelete: (data: PhotosApi.Photo) => void;
  hoverComponent?: React.ReactNode;
}

export function PhotoCard(props: PhotoCardProps) {
  const srcUrl = props.data.thumbnailUrl;
  const [visible, setVisible] = React.useState(false);
  const hover = () => {
    setVisible(true);
  };

  const leave = () => {
    setVisible(false);
  };

  const fullscreen = (photo: PhotosApi.Photo) => {
    const resolvers = Promise.withResolvers<void>();
    ZDialog.show({
      title: photo.name,
      contentContainerClassName: 'max-w-3xl',
      content: (
        <ZImagePreload
          className="w-full max-h-[80vh]"
          src={photo.url}
          alt={photo.name}
          contentMode="contain"
        />
      ),
      onClose: () => resolvers.resolve(),
    });

    return resolvers.promise;
  };

  return (
    <Card
      className="relative overflow-hidden gap-0 py-0"
      onMouseOver={hover}
      onMouseLeave={leave}
    >
      <div className="relative w-full aspect-4/3 bg-muted">
        <ZImagePreload
          className="w-full h-full"
          src={srcUrl}
          alt={props.data.name}
          contentMode="cover"
        />
      </div>
      <CardContent className="px-4 py-4">
        <CardTitle className="text-base">{props.data.name}</CardTitle>
        <div className="mt-3 flex gap-2">
          <ZButton onClick={() => props.onEdit(props.data)}>编辑</ZButton>
          <ZButton
            variant="destructive"
            onClick={() => props.onDelete(props.data)}
          >
            删除
          </ZButton>
        </div>
      </CardContent>
      {visible && (
        <div className="absolute top-0 right-0 left-0 p-2">
          <div className="flex items-center justify-between gap-2">
            <ZButton
              variant="secondary"
              size="icon-sm"
              onClick={() => fullscreen(props.data)}
            >
              <FullscreenOutlined className="text-xl" />
            </ZButton>
            {props.hoverComponent}
          </div>
        </div>
      )}
      {props.data.loading && (
        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-white/50 cursor-wait">
          <LoadingOutlined className="text-2xl" />
        </div>
      )}
    </Card>
  );
}
