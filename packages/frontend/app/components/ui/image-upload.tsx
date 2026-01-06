import React from 'react';
import { tv } from 'tailwind-variants';
import {
  classnames,
  isFunction,
  isString,
  safeObjectURL,
} from '@cms/components/utils';
import { PlusOutlined } from '@ant-design/icons';
import { Image } from './image';

const types = ['image/png', 'image/jpeg'];
interface ImageUploadProps {
  className?: string;
  value?: string;
  onChange?: (blob: string) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export const ImageUpload = function ImageUpload(props: ImageUploadProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = React.useState<string>('');
  React.useEffect(() => {
    setImageUrl(safeObjectURL(props.value));
  }, [props.value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    // 判断是否为合法的图片，只支持 png 和 jpeg
    if (!types.includes(file.type)) {
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    if (isFunction(props.onChange)) {
      props.onChange(url);
    }
  };

  return (
    <div className={props.className}>
      <div
        className="cursor-pointer w-32 h-32 p-1 border border-dashed rounded-sm flex items-center justify-center"
        onClick={() => fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
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
          <PlusOutlined className="text-3xl" />
        )}
      </div>
    </div>
  );
};
