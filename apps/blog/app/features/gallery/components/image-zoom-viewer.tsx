import { cn, ZImage } from '@zcat/ui';
import React, { useEffect, useRef, useState } from 'react';

interface ImageZoomViewerProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImageZoomViewer({ src, alt, className }: ImageZoomViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [imageAR, setImageAR] = useState(1);
  const [containerAR, setContainerAR] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width && height) {
        setContainerAR(width / height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setImageAR(naturalWidth / naturalHeight);
    }
  };

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

  // Determine fitting style based on aspect ratio
  // If image is wider relative to container than its AR, fit by width
  const isWider = imageAR > containerAR;

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full h-full flex items-center justify-center overflow-hidden select-none',
        scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in',
        className,
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <ZImage
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={handleImageLoad}
        className="transition-transform duration-100 ease-out pointer-events-none block max-w-full max-h-full w-auto h-auto object-contain"
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
        }}
        draggable={false}
      />
    </div>
  );
}
