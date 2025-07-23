import React from 'react';
import { tv } from 'tailwind-variants';
import { isString } from '@cms/components/utils';
import { PlusOutlined } from '@ant-design/icons';
import { Image } from './image';

interface ImageUploadProps {
  className?: string;
  value?: string | Blob | null;
  onChange?: (blob: Blob) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const ImageUpload = function ImageUpload(props: ImageUploadProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = React.useState<string>('');
  React.useEffect(() => {
    if (!isString(props.value)) {
      return;
    }
    setImageUrl(props.value);
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    props.onChange?.(file);
    setImageUrl(URL.createObjectURL(file));
  };

  return (
    <div
      className="cursor-pointer w-32 h-32 p-1 border border-dashed rounded-sm"
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        onClick={console.trace}
        type="file"
        className="hidden cursor-pointer"
        onChange={handleChange}
        onBlur={props.onBlur}
      />
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt="上传图片"
          contentMode="cover"
          className="aspect-square"
        />
      ) : (
        <PlusOutlined />
      )}
    </div>
  );
};
