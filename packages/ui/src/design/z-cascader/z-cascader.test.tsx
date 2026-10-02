import type React from 'react';
import { describe, expectTypeOf, it } from 'vitest';

import { ZCascader } from './z-cascader';

describe('ZCascader 公共 props', () => {
  it('只提供值级变更通道', () => {
    expectTypeOf<React.ComponentProps<typeof ZCascader>>().not.toHaveProperty(
      'onChange',
    );
    expectTypeOf<React.ComponentProps<typeof ZCascader>>().toHaveProperty(
      'onValueChange',
    );
  });
});
