import { describe, it, expect } from 'vitest';

import { updateArray, removeArray } from './update-array';

describe('updateArray', () => {
  const items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  it('应该更新存在的项', () => {
    const result = updateArray(items, { id: 1, name: 'Updated 1' });
    expect(result).toHaveLength(3);
    expect(result.find((i) => i.id === 1)?.name).toBe('Updated 1');
  });

  it('应该将不存在的项插入开头', () => {
    const result = updateArray(items, { id: 4, name: 'Item 4' });
    expect(result).toHaveLength(4);
    expect(result[0]).toEqual({ id: 4, name: 'Item 4' });
  });

  it('应该批量更新', () => {
    const result = updateArray(items, [
      { id: 1, name: 'Batch 1' },
      { id: 2, name: 'Batch 2' },
    ]);
    expect(result).toHaveLength(3);
    expect(result.find((i) => i.id === 1)?.name).toBe('Batch 1');
    expect(result.find((i) => i.id === 2)?.name).toBe('Batch 2');
  });

  it('应该使用自定义 key 函数', () => {
    const strItems = [{ key: 'a', value: 1 }];
    const result = updateArray(
      strItems,
      { key: 'a', value: 99 },
      (item) => item.key,
    );
    expect(result[0].value).toBe(99);
  });

  it('不应该修改原数组', () => {
    const original = [...items];
    updateArray(items, { id: 1, name: 'Changed' });
    expect(items).toEqual(original);
  });
});

describe('removeArray', () => {
  const items = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' },
  ];

  it('应该移除存在的项', () => {
    const result = removeArray(items, { id: 1, name: 'Item 1' });
    expect(result).toHaveLength(2);
    expect(result.find((i) => i.id === 1)).toBeUndefined();
  });

  it('不移除不存在的项', () => {
    const result = removeArray(items, { id: 99, name: 'Ghost' });
    expect(result).toHaveLength(3);
  });

  it('应该使用自定义 key 函数', () => {
    const strItems = [{ key: 'a', value: 1 }];
    const result = removeArray(strItems, { key: 'a' }, (item) => item.key);
    expect(result).toHaveLength(0);
  });
});
