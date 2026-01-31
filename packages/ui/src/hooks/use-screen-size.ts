import React from 'react';

export type ScreenSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SCREEN_BREAKPOINTS: Record<ScreenSize, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
};

const SCREEN_SIZES: ScreenSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const defaultConfig = {};

function getNextBreakpointWithValue<T extends Record<ScreenSize, any>>(
  size: ScreenSize,
  config: Partial<T> = defaultConfig,
): T[ScreenSize] | undefined {
  const currentIndex = SCREEN_SIZES.indexOf(size);
  for (let i = currentIndex; i < SCREEN_SIZES.length; i++) {
    const breakpoint = SCREEN_SIZES[i];
    if (config[breakpoint] !== undefined) {
      return config[breakpoint];
    }
  }
  return undefined;
}

export function useScreenSize<T extends Record<ScreenSize, any>>(
  config?: Partial<T>,
): T[ScreenSize] | undefined {
  const [size, setSize] = React.useState<ScreenSize>('md');

  React.useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width >= SCREEN_BREAKPOINTS.xl) {
        setSize('xl');
      } else if (width >= SCREEN_BREAKPOINTS.lg) {
        setSize('lg');
      } else if (width >= SCREEN_BREAKPOINTS.md) {
        setSize('md');
      } else if (width >= SCREEN_BREAKPOINTS.sm) {
        setSize('sm');
      } else {
        setSize('xs');
      }
    };

    updateSize();

    const mqls = Object.entries(SCREEN_BREAKPOINTS).map(([, breakpoint]) =>
      window.matchMedia(`(min-width: ${breakpoint}px)`),
    );

    const onChange = () => updateSize();
    mqls.forEach((mql) => mql.addEventListener('change', onChange));

    return () => {
      mqls.forEach((mql) => mql.removeEventListener('change', onChange));
    };
  }, []);

  if (config) {
    return getNextBreakpointWithValue(size, config);
  }

  return size;
}

export const screenSizeBreakpoints = SCREEN_BREAKPOINTS;
