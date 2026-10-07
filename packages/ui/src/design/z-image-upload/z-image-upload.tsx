import React from 'react';

import { usePropsValue } from '@zcat/ui/hooks';
import { IconClose, IconPhoto } from '@zcat/ui/icons';
import { cn } from '@zcat/ui/shadcn';

import { ZImage } from '../z-image';

const DEFAULT_IMAGE_TYPES = ['image/png', 'image/jpeg'];

const RENDERABLE_SRC_PATTERN = /^(?:https?:|blob:|data:)/i;

function resolveImageSrc(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  return RENDERABLE_SRC_PATTERN.test(value) ? value : undefined;
}

export interface ZImageUploadProps {
  className?: string;
  value?: string;
  onChange?: (url: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  accept?: string;
  types?: string[];
  disabled?: boolean;
}

export function ZImageUpload(props: ZImageUploadProps) {
  const {
    className,
    value,
    onChange,
    onBlur,
    accept = 'image/*',
    types = DEFAULT_IMAGE_TYPES,
    disabled,
  } = props;

  const fileRef = React.useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = usePropsValue({
    defaultValue: '',
    value,
    onChange,
  });

  const previewSrc = resolveImageSrc(imageUrl);

  const handlePick = () => {
    if (disabled) {
      return;
    }
    fileRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!types.includes(file.type)) return;

    const url = URL.createObjectURL(file);
    setImageUrl(url);
  };

  const handleRemove = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (disabled) {
      return;
    }
    setImageUrl('');
  };

  return (
    <div className={className}>
      <div
        className={cn(
          'group relative flex h-32 w-32 cursor-pointer items-center justify-center rounded-sm border border-dashed p-1',
          disabled && 'cursor-not-allowed opacity-60',
        )}
        onClick={handlePick}
      >
        <input
          ref={fileRef}
          type="file"
          accept={accept}
          className="hidden cursor-pointer"
          onChange={handleChange}
          onBlur={onBlur}
          disabled={disabled}
        />
        {previewSrc ? (
          <ZImage
            src={previewSrc}
            alt="上传图片"
            contentMode="cover"
            className="aspect-square"
          />
        ) : (
          <IconPhoto className="h-8 w-8" />
        )}
        {imageUrl ? (
          <button
            type="button"
            aria-label="移除图片"
            disabled={disabled}
            onClick={handleRemove}
            className="absolute right-1 top-1 flex size-6 items-center justify-center rounded-full border border-popover-foreground/10 bg-popover/80 text-popover-foreground opacity-70 shadow-sm backdrop-blur-sm transition-[opacity,transform,background-color] duration-200 outline-none hover:opacity-100 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:opacity-100 active:scale-95 group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-40"
          >
            <IconClose className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
