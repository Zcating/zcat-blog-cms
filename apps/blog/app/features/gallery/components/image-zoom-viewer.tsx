import { cn, ZImage } from '@zcat/ui';
import React, { useRef, useState } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = (e: React.WheelEvent) => {
    // e.stopPropagation(); // Allow scroll if not zoomed? No, prevent default behavior usually.
    // e.preventDefault(); // React synthetic events don't support preventDefault on passive listeners easily.
    // However, for zoom, we usually want to stop propagation to avoid scrolling the page.

    const delta = -e.deltaY * 0.002;
    const newScale = Math.min(Math.max(1, scale + delta), 5); // Limit zoom between 1x and 5x

    // Calculate zoom center logic could be added here for better UX, but center zoom is simpler.
    setScale(newScale);

    if (newScale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault(); // Prevent text selection or image drag
      setDragging(true);
      setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && scale > 1) {
      e.preventDefault();
      const newX = e.clientX - startPos.x;
      const newY = e.clientY - startPos.y;

      // Ideally, limit panning so image doesn't go out of view completely
      // But for simplicity, just update position first.
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setDragging(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (scale > 1) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    } else {
      setScale(2); // Zoom in to 2x
      setPosition({ x: 0, y: 0 }); // Reset position to center for simplicity
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-hidden flex items-center justify-center',
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
        src={src}
        alt={alt}
        className="transition-transform duration-100 ease-out select-none pointer-events-none"
        style={{
          transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
        }}
        contentMode="contain"
        draggable={false}
      />
    </div>
  );
}
