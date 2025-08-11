import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface CellState {
  isLoading: boolean;
  value: string | undefined;
  lastUpdated?: Date;
}

interface AiTaskCellsState {
  [cellId: string]: CellState;
}

interface UseAiTaskCellsOptions {
  userId?: string;
  onCellUpdate?: (cellId: string, value: string) => void;
}

export const useAiTaskCells = (options: UseAiTaskCellsOptions = {}) => {
  const { userId, onCellUpdate } = options;
  const [cellStates, setCellStates] = useState<AiTaskCellsState>({});

  // Set cell as loading
  const setCellLoading = useCallback((cellId: string, isLoading: boolean) => {
    setCellStates(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        isLoading,
        value: prev[cellId]?.value || ''
      }
    }));
  }, []);

  // Update cell value
  const updateCellValue = useCallback((cellId: string, value: string) => {
    console.log('✅ Hook updateCellValue:', { cellId, valueLength: value?.length });
    
    setCellStates(prev => ({
      ...prev,
      [cellId]: {
        ...prev[cellId],
        isLoading: false,
        value,
        lastUpdated: new Date()
      }
    }));
    onCellUpdate?.(cellId, value);
  }, [onCellUpdate]);

  // Initialize cell state
  const initializeCell = useCallback((cellId: string, initialValue: string = '') => {
    setCellStates(prev => ({
      ...prev,
      [cellId]: {
        isLoading: false,
        value: initialValue
      }
    }));
  }, []);

  // Note: WebSocket connection moved to page level to avoid multiple connections

  // Get cell state
  const getCellState = useCallback((cellId: string): CellState => {
    return cellStates[cellId] || { isLoading: false, value: undefined };
  }, [cellStates]);

  // Mark multiple cells as loading (when AI job starts)
  const setCellsLoading = useCallback((cellIds: string[]) => {
    setCellStates(prev => {
      const newState = { ...prev };
      cellIds.forEach(cellId => {
        newState[cellId] = {
          ...newState[cellId],
          isLoading: true,
          value: newState[cellId]?.value || ''
        };
      });
      return newState;
    });
  }, []);

  return {
    cellStates,
    getCellState,
    setCellLoading,
    updateCellValue,
    initializeCell,
    setCellsLoading
  };
}; 