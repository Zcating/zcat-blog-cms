import { tv } from 'tailwind-variants';
import { classnames } from '@cms/components/utils';

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

  value?: File | null;
  onChange?: (file: File) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

export function ImageUpload(props: ImageUploadProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    props.onChange?.(file);
  };

  const imageUploadClassNames = classnames(
    ImageUploadClassVariant({
      variant: 'neutral',
      size: 'md',
      appearance: 'default',
    }),
    props.className,
  );

  return (
    <input
      type="file"
      className={imageUploadClassNames}
      onChange={handleChange}
      onBlur={props.onBlur}
    />
  );
}
