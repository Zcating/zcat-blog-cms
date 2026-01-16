import React from 'react';

import { cn } from '@zcat/ui/shadcn';

import { Spinner } from '../../shadcn/ui/spinner';
import { ZView } from '../z-view';

import { ZImage, type ZImageProps } from './z-image';

interface ImagePreloadProps extends ZImageProps {
  imageClassName?: string;
}

export function ImagePreload(props: ImagePreloadProps) {
  const { src, className, imageClassName, ...rest } = props;
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    if (!src) {
      return;
    }
    setLoaded(false);

    const image = new window.Image();
    image.onload = function () {
      setLoaded(true);
    };
    image.src = src;
  }, [src]);

  const viewClassName = cn(
    'flex items-center justify-center w-full',
    !loaded && 'aspect-square',
    className,
  );

  return (
    <ZView className={viewClassName}>
      {loaded ? (
        <ZImage
          contentMode="contain"
          src={src}
          className={imageClassName}
          {...rest}
        />
      ) : (
        <Spinner className="text-muted-foreground size-8" />
      )}
    </ZView>
  );
}
