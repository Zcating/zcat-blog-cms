import { Button, useBoolean } from '@cms/components';
import React from 'react';

interface BatchDeleteButtonsProps<T = any> {
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onDelete: (items: T[]) => Promise<void>;
  onCancel: () => void;

  batchMode: boolean;
  onBatchMode: (mode: boolean) => void;
}
export function BatchDeleteButtons<T>(props: BatchDeleteButtonsProps<T>) {
  const { data, keyExtractor, onDelete, batchMode, onBatchMode } = props;

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      await Promise.all(Array.from(selectedItems).map((id) => deleteItem(id)));

      const deletedIds = Array.from(selectedItems);
      setSelectedItems(new Set());
      setBatchMode(false);
      onDeleteSuccess?.(deletedIds);
    } catch (error) {
      console.error('批量删除失败:', error);
      throw error;
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map((item) => getItemId(item))));
    }
  };

  const handleCancelBatch = () => {
    setBatchMode(false);
    setSelectedItems(new Set());
  };

  const isItemSelected = (item: T) => {
    return selectedItems.has(keyExtractor(item, 0));
  };

  const [isAllSelected, setIsAllSelected] = useBoolean(false);

  return (
    <div>
      {!batchMode ? (
        <Button variant="neutral" onClick={() => onBatchMode(true)}>
          批量删除
        </Button>
      ) : (
        <div className="flex gap-3">
          <Button variant="neutral" onClick={setIsAllSelected}>
            {isAllSelected ? '取消全选' : '全选'}
          </Button>
          <Button
            variant="error"
            onClick={onDelete}
            // disabled={}
          >
            删除选中 ({selectedCount})
          </Button>
          <Button variant="neutral" onClick={onCancel}>
            取消
          </Button>
        </div>
      )}
    </div>
  );
}
