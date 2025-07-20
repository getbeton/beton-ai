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
  cellId: string;
  userId?: string;
  onCellUpdate?: (cellId: string, value: string) => void;
}

export const TableCellRenderer: React.FC<TableCellRendererProps> = ({
  value,
  column,
  cellId,
  userId,
  onCellUpdate
}) => {
  const { getCellState, updateCellValue, initializeCell } = useAiTaskCells({
    userId,
    onCellUpdate
  });

  // Initialize cell state if it's an AI task column
  if (column.type === 'ai_task') {
    const cellState = getCellState(cellId);
    
    // If no state exists, initialize with current value
    if (!cellState.value && value) {
      initializeCell(cellId, value);
    }

    return (
      <AiTaskCell
        value={cellState.value || value}
        isLoading={cellState.isLoading}
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