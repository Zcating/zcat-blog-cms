import React from 'react';

import type { UseReactFormReturnType } from './types';

export const ZFormContext =
  React.createContext<UseReactFormReturnType<any> | null>(null);
