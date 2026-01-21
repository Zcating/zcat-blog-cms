import * as React from 'react';

export function useShortcut(defaultShortcut = 'Ctrl + Enter') {
  const [shortcut, setShortcut] = React.useState(defaultShortcut);

  React.useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const isMac =
        navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
        navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
      if (isMac) {
        setShortcut('⌘ + Enter');
      }
    }
  }, []);

  return shortcut;
}
