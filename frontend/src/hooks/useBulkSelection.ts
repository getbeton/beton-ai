'use client';

import { useState, useCallback, useEffect } from 'react';

interface BulkSelectionState {
  selectedIds: Set<string>;
  isSelecting: boolean;
  showBulkActions: boolean;
}

interface UseBulkSelectionOptions {
  allItemIds: string[];
  onSelectionChange?: (selectedIds: Set<string>) => void;
}

export const useBulkSelection = ({ allItemIds, onSelectionChange }: UseBulkSelectionOptions) => {
  const [state, setState] = useState<BulkSelectionState>({
    selectedIds: new Set(),
    isSelecting: false,
    showBulkActions: false
  });

  // Reset selection when all items change
  useEffect(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(),
      showBulkActions: false
    }));
  }, [allItemIds.join(',')]);

  // Notify parent of selection changes
  useEffect(() => {
    onSelectionChange?.(state.selectedIds);
  }, [state.selectedIds, onSelectionChange]);

  // Toggle single item selection
  const toggleItem = useCallback((id: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedIds);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      
      return {
        ...prev,
        selectedIds: newSelected,
        showBulkActions: newSelected.size > 0
      };
    });
  }, []);

  // Check if item is selected
  const isSelected = useCallback((id: string) => {
    return state.selectedIds.has(id);
  }, [state.selectedIds]);

  // Select all items
  const selectAll = useCallback(() => {
    setState(prev => {
      const isAllSelected = prev.selectedIds.size === allItemIds.length && allItemIds.length > 0;
      
      return {
        ...prev,
        selectedIds: isAllSelected ? new Set() : new Set(allItemIds),
        showBulkActions: !isAllSelected && allItemIds.length > 0
      };
    });
  }, [allItemIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedIds: new Set(),
      showBulkActions: false,
      isSelecting: false
    }));
  }, []);

  // Toggle bulk selection mode
  const toggleBulkMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isSelecting: !prev.isSelecting,
      selectedIds: new Set(), // Clear selection when toggling
      showBulkActions: false
    }));
  }, []);

  // Check if all items are selected
  const isAllSelected = state.selectedIds.size === allItemIds.length && allItemIds.length > 0;
  
  // Check if some items are selected (for indeterminate state)
  const isIndeterminate = state.selectedIds.size > 0 && state.selectedIds.size < allItemIds.length;

  // Get selected items count
  const selectedCount = state.selectedIds.size;

  // Get array of selected IDs
  const selectedIds = Array.from(state.selectedIds);

  return {
    // State
    selectedIds: state.selectedIds,
    selectedCount,
    selectedIdsArray: selectedIds,
    isSelecting: state.isSelecting,
    showBulkActions: state.showBulkActions,
    isAllSelected,
    isIndeterminate,

    // Actions
    toggleItem,
    isSelected,
    selectAll,
    clearSelection,
    toggleBulkMode,
  };
};

export default useBulkSelection;
