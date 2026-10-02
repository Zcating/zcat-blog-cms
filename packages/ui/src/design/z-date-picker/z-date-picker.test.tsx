import type React from 'react';
import { describe, expectTypeOf, it } from 'vitest';

import { ZDatePicker } from './z-date-picker';

describe('ZDatePicker 公共 props', () => {
  it('只提供值级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZDatePicker>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZDatePicker>>().toHaveProperty(
      'onValueChange',
    );
  });
});
