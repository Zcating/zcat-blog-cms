import { describe, expect, it } from 'vitest';

import { SCHEMA_COMPONENT_MAP } from './schema-component-map';

describe('schema-form', () => {
  it('SCHEMA_COMPONENT_MAP has all required entries', () => {
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('select');
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('input');
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('imageUpload');
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('checkbox');
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('textarea');
    expect(SCHEMA_COMPONENT_MAP).toHaveProperty('constant');
  });
});
