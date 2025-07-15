import { tv } from 'tailwind-variants';
import { classnames, isString } from '@cms/components/utils';
import React from 'react';
import { PlusOutlined } from '@ant-design/icons';

export type ImageUploadVariant =
  | 'neutral'
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'error';

export type ImageUploadSize = 'sm' | 'md' | 'lg' | 'xl' | 'xs';

export type ImageUploadAppearance = 'default' | 'ghost';

const ImageUploadClassVariant = tv({
  base: 'file-input',
  variants: {
    appearance: {
      default: '',
      ghost: 'file-input-ghost',
    },
    variant: {
      neutral: 'file-input-neutral',
      primary: 'file-input-primary',
      secondary: 'file-input-secondary',
      accent: 'file-input-accent',
      info: 'file-input-info',
      success: 'file-input-success',
      warning: 'file-input-warning',
      error: 'file-input-error',
    },
    size: {
      sm: 'file-input-sm',
      md: 'file-input-md',
      lg: 'file-input-lg',
      xl: 'file-input-xl',
      xs: 'file-input-xs',
    },
  },
});

interface ImageUploadProps {
  className?: string;
  variant?: ImageUploadVariant;
  size?: ImageUploadSize;
  appearance?: ImageUploadAppearance;
  value?: string | Blob | null;
  onChange?: (blob: Blob) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function ImageUpload(props: ImageUploadProps) {
  const imageUploadClassNames = classnames(
    ImageUploadClassVariant({
      variant: props.variant,
      size: props.size,
      appearance: props.appearance,
    }),
    props.className,
  );

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

  const imageRef = React.useRef<HTMLImageElement>(null);

  // const imageUrl = URL.createObjectURL();

  return (
    <div className="space-y-2">
      <input
        type="file"
        className={imageUploadClassNames}
        onChange={handleChange}
        onBlur={props.onBlur}
      />
      {imageUrl ? (
        <div className="border border-dashed">
          <img
            ref={imageRef}
            src={imageUrl}
            alt="上传图片"
            className="aspect-square object-contain w-full"
          />
        </div>
      ) : (
        <div className="w-full aspect-square flex items-center justify-center border border-dashed cursor-pointer">
          <PlusOutlined />
        </div>
      )}
    </div>
  );
}
