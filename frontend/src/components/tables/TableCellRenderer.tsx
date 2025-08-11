'use client';

import { AiTaskCell } from './AiTaskCell';
import { useAiTaskCells } from '@/hooks/useAiTaskCells';

interface TableCellRendererProps {
  value: string;
  column: {
    id: string;
    type: string;
    name: string;
  };
  rowId: string;
  cellId?: string; // Real cellId from database
  userId?: string;
  onCellUpdate?: (rowId: string, columnId: string, value: string) => void;
  onExecuteCell?: (rowId: string, columnId: string) => void;
  // Pass state from page-level hook
  aiTaskCells?: {
    getCellState: (cellId: string) => { isLoading: boolean; value: string | undefined };
    updateCellValue: (cellId: string, value: string) => void;
    initializeCell: (cellId: string, initialValue: string) => void;
  };
}

export const TableCellRenderer: React.FC<TableCellRendererProps> = ({
  value,
  column,
  rowId,
  cellId,
  userId,
  onCellUpdate,
  onExecuteCell,
  aiTaskCells
}) => {
  // Use passed-in hook functions if available, otherwise create local hook (for backward compatibility)
  const localHook = useAiTaskCells({
    userId,
    onCellUpdate: onCellUpdate ? (cellId: string, value: string) => {
      console.log('🔗 hookOnCellUpdate wrapper called:', {
        cellId,
        value,
        rowId,
        columnId: column.id,
        source: 'TableCellRenderer-wrapper'
      });
      onCellUpdate(rowId, column.id, value);
    } : undefined
  });

  const { getCellState, updateCellValue, initializeCell } = aiTaskCells || localHook;

  // Initialize cell state if it's an AI task column
  if (column.type === 'ai_task') {
    // Use real cellId if available, otherwise fall back to synthetic cellId for backwards compatibility
    const actualCellId = cellId || `${rowId}-${column.id}`;
    const cellState = getCellState(actualCellId);
    
    // If no state exists, initialize with current value  
    if (cellState.value === undefined && value) {
      initializeCell(actualCellId, value);
    }

    // Create a wrapper that updates hook state (which will trigger the callback)
    const handleCellValueChange = (rowId: string, columnId: string, newValue: string) => {
      console.log('💾 Manual edit:', { actualCellId, newValue });
      updateCellValue(actualCellId, newValue);
    };

    // Use hook state if it exists (even if empty), otherwise fall back to prop value
    const finalValue = cellState.value !== undefined ? cellState.value : value;
    
    console.log('🎨 Render:', {
      actualCellId,
      usingCentralizedHook: !!aiTaskCells,
      hookValue: cellState.value,
      finalValue: finalValue?.substring(0, 50) + (finalValue?.length > 50 ? '...' : ''),
      usedHookValue: cellState.value !== undefined
    });

    return (
      <AiTaskCell
        value={finalValue}
        isLoading={cellState.isLoading}
        rowId={rowId}
        columnId={column.id}
        onValueChange={handleCellValueChange}
        onExecuteCell={onExecuteCell}
      />
    );
  }

  // Default rendering for other column types
  switch (column.type) {
    case 'currency':
      const numValue = parseFloat(value);
      return (
        <span>
          {isNaN(numValue) ? value : `$${numValue.toLocaleString()}`}
        </span>
      );
    
    case 'url':
      if (value && value.startsWith('http')) {
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
            {value}
          </a>
        );
      }
      return <span>{value}</span>;
    
    case 'email':
      if (value && value.includes('@')) {
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        );
      }
      return <span>{value}</span>;
    
    case 'checkbox':
      return (
        <input 
          type="checkbox" 
          checked={value === 'true' || value === '1'} 
          readOnly 
          className="cursor-default"
        />
      );
    
    default:
      return <span>{value}</span>;
  }
}; 