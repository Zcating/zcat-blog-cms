import * as React from 'react';

type UseCarouselWheelProps = {
  scrollNext: () => void;
  scrollPrev: () => void;
  scrollbarable?: boolean;
};

export function useCarouselWheel({
  scrollNext,
  scrollPrev,
  scrollbarable = false,
}: UseCarouselWheelProps) {
  const isScrollingRef = React.useRef(false);
  const timeoutRef = React.useRef<number | null>(null);

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      if (!scrollbarable) return;

      event.preventDefault();

      // 如果正在滚动中，忽略后续滚动事件
      if (isScrollingRef.current) return;

      // 设置滚动状态为 true
      isScrollingRef.current = true;

      // 向后滚动（deltaY > 0）页面往右，向前滚动（deltaY < 0）页面往左
      if (event.deltaY > 0) {
        scrollNext();
      } else if (event.deltaY < 0) {
        scrollPrev();
      }

      // 清除之前的定时器
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      // 300ms 后重置滚动状态，允许下次滚动
      timeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    },
    [scrollNext, scrollPrev, scrollbarable],
  );

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { handleWheel };
}
