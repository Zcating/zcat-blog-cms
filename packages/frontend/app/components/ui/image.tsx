import React from 'react';

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const Image = React.forwardRef<HTMLImageElement, ImageProps>(
  function Image(props: ImageProps, ref) {
    const { src, alt, className } = props;

    return (
      <img {...props} ref={ref} src={src} alt={alt} className={className} />
    );
  },
);
