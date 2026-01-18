import React from 'react';

import { IconPhoto } from '@zcat/ui/icons';
import { cn } from '@zcat/ui/shadcn';

import { ZImage } from '../z-image';

const DEFAULT_IMAGE_TYPES = ['image/png', 'image/jpeg'];

export interface ZImageUploadProps {
  className?: string;
  value?: string | Blob;
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
  const ownedObjectUrlRef = React.useRef<string | null>(null);

  const [imageUrl, setImageUrl] = React.useState<string>('');

  React.useEffect(() => {
    if (ownedObjectUrlRef.current) {
      URL.revokeObjectURL(ownedObjectUrlRef.current);
      ownedObjectUrlRef.current = null;
    }

    if (value instanceof Blob) {
      const url = URL.createObjectURL(value);
      ownedObjectUrlRef.current = url;
      setImageUrl(url);
      return;
    }

    setImageUrl(typeof value === 'string' ? value : '');
  }, [value]);

  React.useEffect(() => {
    return () => {
      if (ownedObjectUrlRef.current) {
        URL.revokeObjectURL(ownedObjectUrlRef.current);
        ownedObjectUrlRef.current = null;
      }
    };
  }, []);

  const handlePick = () => {
    if (disabled) return;
    fileRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;
    if (!types.includes(file.type)) return;

    if (ownedObjectUrlRef.current) {
      URL.revokeObjectURL(ownedObjectUrlRef.current);
      ownedObjectUrlRef.current = null;
    }

    const url = URL.createObjectURL(file);
    ownedObjectUrlRef.current = url;
    setImageUrl(url);
    onChange?.(url);
  };

  return (
    <div className={className}>
      <div
        className={cn(
          'flex h-32 w-32 cursor-pointer items-center justify-center rounded-sm border border-dashed p-1',
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
        {imageUrl ? (
          <ZImage
            src={imageUrl}
            alt="上传图片"
            contentMode="cover"
            className="aspect-square"
          />
        ) : (
          <IconPhoto className="h-8 w-8" />
        )}
      </div>
    </div>
  );
}
