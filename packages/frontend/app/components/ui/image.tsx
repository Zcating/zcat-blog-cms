import React from 'react';
import { tv } from 'tailwind-variants';
import { classnames } from '../utils';

const imageTv = tv({
  variants: {
    contentMode: {
      cover: 'object-cover',
      contain: 'object-contain',
      fill: 'object-fill',
      none: 'object-none',
      scaleDown: 'object-scale-down',
    },
  },
  defaultVariants: {
    contentMode: 'cover',
  },
});

type ImageContentMode = keyof typeof imageTv.variants.contentMode;

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  contentMode?: ImageContentMode;
}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  function Image(props: ImageProps, ref) {
    const { src, alt, className, contentMode } = props;

    return (
      <img
        {...props}
        ref={ref}
        src={src}
        alt={alt}
        className={classnames(imageTv({ contentMode }), className)}
      />
    );
  },
);
