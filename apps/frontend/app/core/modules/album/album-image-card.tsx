import { LoadingOutlined } from '@ant-design/icons';
import { Card, CardContent, CardTitle, ZButton, ZImagePreload } from '@zcat/ui';

import type { AlbumsApi } from '@cms/api';

export interface PhotoAlbumData extends AlbumsApi.PhotoAlbum {
  loading?: boolean;
}

interface AlbumImageCardProps {
  data: PhotoAlbumData;
  onEdit: (item: PhotoAlbumData) => void;
  onClickItem: (item: PhotoAlbumData) => void;
}

export function AlbumImageCard(props: AlbumImageCardProps) {
  const data = props.data;

  const handleEdit = () => {
    props.onEdit(data);
  };

  const handleDetail = () => {
    props.onClickItem(data);
  };

  return (
    <Card className="relative overflow-hidden gap-0 py-0">
      <div className="relative w-full aspect-square bg-muted">
        <ZImagePreload
          className="w-full h-full"
          src={data.cover?.url}
          alt={data.name}
          contentMode="cover"
        />
      </div>
      <CardContent className="px-4 py-4 space-y-2">
        <CardTitle className="text-base">{data.name}</CardTitle>
        <p className="h-10 text-sm text-muted-foreground">{data.description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <ZButton onClick={handleEdit}>编辑</ZButton>
          <ZButton variant="outline" onClick={handleDetail}>
            查看详情
          </ZButton>
        </div>
      </CardContent>
      {props.data.loading && (
        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-white/50 cursor-wait">
          <LoadingOutlined className="text-2xl" />
        </div>
      )}
    </Card>
  );
}
