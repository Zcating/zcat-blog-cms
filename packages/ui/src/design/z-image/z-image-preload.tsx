import React from 'react';

import { IconPhoto } from '@zcat/ui/icons';
import { cn } from '@zcat/ui/shadcn';

import { Spinner } from '../../shadcn/ui/spinner';
import { ZView } from '../z-view';

import { ZImage, type ZImageProps } from './z-image';

interface ImagePreloadProps extends ZImageProps {
  imageClassName?: string;
}

type ImagePreloadStatus = 'pending' | 'fulfilled' | 'rejected';

export function ZImagePreload(props: ImagePreloadProps) {
  const { src, className, imageClassName, ...rest } = props;
  const [status, setStatus] = React.useState<ImagePreloadStatus>('pending');

  React.useEffect(() => {
    if (!src) {
      setStatus('rejected');
      return;
    }
    setStatus('pending');

    const image = new window.Image();
    let cancelled = false;
    image.onload = function () {
      if (cancelled) return;
      setStatus('fulfilled');
    };
    image.onerror = function () {
      if (cancelled) return;
      setStatus('rejected');
    };
    image.src = src;

    return () => {
      cancelled = true;
    };
  }, [src]);

  const viewClassName = cn(
    'flex items-center justify-center w-full',
    status !== 'fulfilled' && 'aspect-square',
    className,
  );

  return (
    <ZView className={viewClassName}>
      <ImagePreloadContent
        status={status}
        src={src}
        imageClassName={imageClassName}
        {...rest}
      />
    </ZView>
  );
}

interface ImagePreloadContentProps extends Omit<
  ImagePreloadProps,
  'className'
> {
  status: ImagePreloadStatus;
}

function ImagePreloadContent(props: ImagePreloadContentProps) {
  const { status, src, imageClassName, ...imageProps } = props;

  switch (status) {
    case 'fulfilled':
      return (
        <ZImage
          contentMode="contain"
          src={src}
          className={imageClassName}
          {...imageProps}
        />
      );
    case 'rejected':
      return <IconPhoto className="text-muted-foreground size-10" />;
    case 'pending':
    default:
      return <Spinner className="text-muted-foreground size-8" />;
  }
}
