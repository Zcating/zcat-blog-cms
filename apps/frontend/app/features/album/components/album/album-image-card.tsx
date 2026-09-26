import { Loader } from 'lucide-react';
import {
  Card,
  CardContent,
  CardTitle,
  ZButton,
  ZDialog,
  ZImagePreload,
} from '@zcat/ui';

import type { PhotoAlbum } from '@cms/server/albums/schemas';

export interface PhotoAlbumData extends PhotoAlbum {
  loading?: boolean;
}

interface AlbumImageCardProps {
  data: PhotoAlbumData;
  onEdit: (item: PhotoAlbumData) => void;
  onDelete: (item: PhotoAlbumData) => void;
  onClickItem: (item: PhotoAlbumData) => void;
}

export function AlbumImageCard(props: AlbumImageCardProps) {
  const data = props.data;

  const handleEdit = () => {
    props.onEdit(data);
  };

  const handleDelete = async () => {
    const confirm = await ZDialog.confirm({
      title: '删除相册',
      content: (
        <div>
          确定删除相册 <strong>{data.name}</strong> 吗？
        </div>
      ),
    });
    if (!confirm) return;
    props.onDelete(data);
  };

  const handleDetail = () => {
    props.onClickItem(data);
  };

  return (
    <Card className="relative overflow-hidden gap-0 py-0">
      <ZImagePreload
        className="w-full h-full bg-muted"
        imageClassName="aspect-square"
        src={data.cover?.url}
        alt={data.name}
        contentMode="cover"
      />
      <CardContent className="px-4 py-4 space-y-2">
        <CardTitle className="text-base">{data.name}</CardTitle>
        <p className="h-10 text-sm text-muted-foreground">{data.description}</p>
        <div className="flex justify-end gap-2 pt-2">
          <ZButton onClick={handleEdit}>编辑</ZButton>
          <ZButton variant="destructive" onClick={handleDelete}>
            删除
          </ZButton>
          <ZButton variant="outline" onClick={handleDetail}>
            查看详情
          </ZButton>
        </div>
      </CardContent>
      {props.data.loading && (
        <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-white/50 cursor-wait">
          <Loader className="text-2xl animate-spin" />
        </div>
      )}
    </Card>
  );
}
