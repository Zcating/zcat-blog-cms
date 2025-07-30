import React from 'react';

interface UseBatchDeleteOptions<T> {
  items: T[];
  getItemId: (item: T) => number;
  deleteItem: (id: number) => Promise<void>;
  onDeleteSuccess?: (deletedIds: number[]) => void;
}

export function useBatchDelete<T>(options: UseBatchDeleteOptions<T>) {
  const { items, getItemId, deleteItem, onDeleteSuccess } = options;
  
  const [batchMode, setBatchMode] = React.useState(false);
  const [selectedItems, setSelectedItems] = React.useState<Set<number>>(new Set());

  const handleItemSelect = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedItems);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedItems).map(id => deleteItem(id))
      );
      
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
      setSelectedItems(new Set(items.map(item => getItemId(item))));
    }
  };

  const handleCancelBatch = () => {
    setBatchMode(false);
    setSelectedItems(new Set());
  };

  const isItemSelected = (item: T) => {
    return selectedItems.has(getItemId(item));
  };

  return {
    batchMode,
    setBatchMode,
    selectedItems,
    selectedCount: selectedItems.size,
    handleItemSelect,
    handleBatchDelete,
    handleSelectAll,
    handleCancelBatch,
    isItemSelected,
    isAllSelected: selectedItems.size === items.length,
    hasSelection: selectedItems.size > 0,
  };
}