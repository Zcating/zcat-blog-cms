import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { SCHEMA_COMPONENT_MAP } from './schema-component-map';

describe('SCHEMA_COMPONENT_MAP', () => {
  it('returns null for unknown field type', () => {
    const result = SCHEMA_COMPONENT_MAP.select({ type: 'input' } as any);
    expect(result).toBeNull();
  });

  it('select returns a component for select type', () => {
    const component = SCHEMA_COMPONENT_MAP.select({
      type: 'select',
      key: 'test',
      label: 'Test',
    } as any);
    expect(component).not.toBeNull();
  });

  it('input returns a component for input type', () => {
    const component = SCHEMA_COMPONENT_MAP.input({
      type: 'input',
      key: 'test',
      label: 'Test',
    } as any);
    expect(component).not.toBeNull();
  });

  it('constant returns null', () => {
    const result = SCHEMA_COMPONENT_MAP.constant({} as any);
    expect(result).toBeNull();
  });
});
