import { ZImage, ZView } from '@zcat/ui';

export interface GalleryThumbnailListProps {
  items: {
    id: string;
    url: string;
    name?: string;
  }[];
  value: number;
  onValueChange: (index: number) => void;
}

export function GalleryThumbnailList({
  items,
  value,
  onValueChange,
}: GalleryThumbnailListProps) {
  return (
    <ZView className="h-24 w-full bg-black/80 flex items-center px-4 gap-2 overflow-x-auto border-t border-white/10 shrink-0">
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => onValueChange(index)}
          className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-md transition-all ${
            value === index
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
  );
}
