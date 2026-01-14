import React from 'react';

import { IconContainer, IconPhoto } from '@zcat/ui/icons';
import { cn } from '@zcat/ui/shadcn';

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

  const cls = cn('flex items-center justify-center w-full h-full', className);

  return (
    <ZView className={cls}>
      {loaded ? (
        <ZImage
          contentMode="contain"
          src={src}
          className={imageClassName}
          {...rest}
        />
      ) : (
        <IconContainer Renderer={IconPhoto} size="lg" />
      )}
    </ZView>
  );
}
