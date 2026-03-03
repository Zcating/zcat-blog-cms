import { cn, ZImage } from '@zcat/ui';
import React, { useEffect, useMemo, useRef, useState } from 'react';

interface ImageZoomViewerProps {
  src: string;
  alt?: string;
  className?: string;
  onClickBackdrop?: () => void;
}

export function ImageZoomViewer({
  src,
  alt,
  className,
  onClickBackdrop,
}: ImageZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!document.body) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setScreenSize({ width, height });
    });

    observer.observe(document.body);
    return () => observer.disconnect();
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    setImageSize({ width: naturalWidth, height: naturalHeight });
  };

  const displaySize = useMemo(() => {
    if (
      !screenSize.width ||
      !screenSize.height ||
      !imageSize.width ||
      !imageSize.height
    ) {
      return {
        width: 0,
        height: 0,
      };
    }
    const sw = screenSize.width;
    const sh = screenSize.height;
    const nw = imageSize.width;
    const nh = imageSize.height;

    const imageRate = nw / nh;
    const padding = 50;

    if (imageRate > 1) {
      return {
        width: (sh - padding) * imageRate,
        height: sh - padding,
      };
    } else {
      return {
        width: (sh - padding) * imageRate,
        height: sh - padding,
      };
    }
  }, [screenSize, imageSize]);

  const getBounds = (currentScale: number) => {
    if (!containerRef.current || !imageRef.current) return { maxX: 0, maxY: 0 };
    const container = containerRef.current;
    const img = imageRef.current;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const rw = img.offsetWidth;
    const rh = img.offsetHeight;

    const maxX = Math.max(0, (rw * currentScale - cw) / 2);
    const maxY = Math.max(0, (rh * currentScale - ch) / 2);

    return { maxX, maxY };
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(1, scale + delta), 5);

    setScale(newScale);

    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    } else if (newScale < 1.1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && scale > 1) {
      e.preventDefault();
      const rawX = e.clientX - startPos.x;
      const rawY = e.clientY - startPos.y;

      const { maxX, maxY } = getBounds(scale);

      const newX = Math.max(-maxX, Math.min(maxX, rawX));
      const newY = Math.max(-maxY, Math.min(maxY, rawY));

      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleClickImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('click');
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-screen h-screen flex items-center justify-center overflow-hidden select-none bg-black/95',
        className,
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <div
        className="absolute top-0 left-0 w-full h-full"
        onClick={onClickBackdrop}
      />
      <ZImage
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        contentMode="contain"
        className={cn(
          'rounded-md transition-transform duration-100 ease-out block',
          scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        )}
        style={{
          width: displaySize?.width,
          height: displaySize?.height,
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
        draggable={false}
        onClick={handleClickImage}
      />
    </div>
  );
}
