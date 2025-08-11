'use client';

import { useState, useRef, useEffect } from 'react';
import { Loader2, Edit3, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiTaskCellProps {
  value: string;
  isLoading?: boolean;
  rowId?: string;
  columnId?: string;
  onValueChange?: (rowId: string, columnId: string, newValue: string) => void;
  onExecuteCell?: (rowId: string, columnId: string) => void;
}

export const AiTaskCell: React.FC<AiTaskCellProps> = ({ 
  value, 
  isLoading = false,
  rowId,
  columnId,
  onValueChange,
  onExecuteCell
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [truncatedText, setTruncatedText] = useState('');
  const [needsTruncation, setNeedsTruncation] = useState(false);
  
  const cellRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Sync editValue with value prop changes
  useEffect(() => {
    setEditValue(value);
  }, [value]);


  
  // Calculate truncated text based on available width
  useEffect(() => {
    if (!value || isExpanded || isLoading) {
      setTruncatedText(value);
      setNeedsTruncation(false);
      return;
    }

    const calculateTruncation = () => {
      if (!cellRef.current) return;
      
      const cellWidth = cellRef.current.offsetWidth - 24; // Account for padding
      
      // If there's very little space, always truncate to a minimal amount
      if (cellWidth < 50) {
        setTruncatedText(value.length > 0 ? value.charAt(0) + '...' : value);
        setNeedsTruncation(value.length > 1);
        return;
      }
      
      const tempSpan = document.createElement('span');
      tempSpan.style.visibility = 'hidden';
      tempSpan.style.position = 'absolute';
      tempSpan.style.fontSize = '14px';
      tempSpan.style.lineHeight = '1.4';
      tempSpan.style.fontFamily = getComputedStyle(cellRef.current).fontFamily;
      tempSpan.style.whiteSpace = 'nowrap';
      document.body.appendChild(tempSpan);
      
      // First check if the full text fits
      tempSpan.textContent = value;
      if (tempSpan.offsetWidth <= cellWidth) {
        document.body.removeChild(tempSpan);
        setTruncatedText(value);
        setNeedsTruncation(false);
        return;
      }
      
      // Use binary search to find optimal truncation point (much faster for long content)
      let left = 0;
      let right = value.length;
      let bestFit = 0;
      
      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        const testText = value.substring(0, mid) + '...';
        tempSpan.textContent = testText;
        
        if (tempSpan.offsetWidth <= cellWidth) {
          bestFit = mid;
          left = mid + 1;
        } else {
          right = mid - 1;
        }
      }
      
      document.body.removeChild(tempSpan);
      
      const shouldTruncate = bestFit < value.length;
      const truncatedText = shouldTruncate ? value.substring(0, bestFit) + '...' : value;
      
      setTruncatedText(truncatedText);
      setNeedsTruncation(shouldTruncate);
    };

    // Calculate on mount and when value changes
    setTimeout(calculateTruncation, 0);
    
    // Recalculate on window resize
    const handleResize = () => setTimeout(calculateTruncation, 0);
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [value, isExpanded, isLoading]);

  // Handle click to expand
  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing && !isExpanded) {
      setIsExpanded(true);
    }
  };

  // Handle double click to edit
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditing) {
      // Expand first if not already expanded
      if (!isExpanded) {
        setIsExpanded(true);
      }
      setIsEditing(true);
      setEditValue(value);
      setTimeout(() => textareaRef.current?.focus(), 0);
    }
  };

  // Handle save edit
  const handleSave = () => {
    if (rowId && columnId && onValueChange) {
      onValueChange(rowId, columnId, editValue);
    }
    setIsEditing(false);
    setIsExpanded(false); // Collapse after save to show the updated content
  };

  // Handle cancel edit
  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  // Handle key press in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  };

  // Handle execute cell
  const handleExecuteCell = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (rowId && columnId && onExecuteCell) {
      onExecuteCell(rowId, columnId);
    }
  };

  // Handle click outside to collapse
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cellRef.current && !cellRef.current.contains(event.target as Node)) {
        if (isEditing) {
          handleSave();
        } else if (isExpanded) {
          setIsExpanded(false);
        }
      }
    };

    if (isExpanded || isEditing) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isExpanded, isEditing]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded min-h-[2rem]">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-600">Generating...</span>
      </div>
    );
  }

  if (!value || value.trim().length === 0) {
    return (
      <div className="relative group p-2 min-h-[2rem] flex items-center">
        <span className="text-muted-foreground italic text-sm">
          No content generated
        </span>
        
        {/* Play button for empty state */}
        {onExecuteCell && rowId && columnId && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded">
            <button
              onClick={handleExecuteCell}
              className="flex items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded shadow-sm transition-colors"
              title="Execute AI task for this cell"
            >
              <Play className="h-3 w-3" />
              Run
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={cellRef}
      className={cn(
        "relative group transition-all duration-200",
        isExpanded ? "bg-white border border-border rounded-lg shadow-sm z-10" : "cursor-pointer",
        !isExpanded && "hover:bg-muted/30"
      )}
      onClick={handleCellClick}
      onDoubleClick={handleDoubleClick}
    >
      {isExpanded && isEditing ? (
        <div className="p-3">
          <textarea
            ref={textareaRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[100px] p-2 text-sm border border-border rounded resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Enter AI task content..."
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCancel();
              }}
              className="px-3 py-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSave();
              }}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className={cn(
          "p-2 text-sm leading-relaxed",
          isExpanded ? "min-h-[100px] max-h-[300px] overflow-y-auto" : "min-h-[2rem]"
        )}>
          <div className={cn(
            "whitespace-pre-wrap break-words",
            isExpanded && "pb-6"
          )}>
            {isExpanded ? value : truncatedText}
          </div>
          
          {/* Expand indicator and play button for collapsed state */}
          {!isExpanded && (
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5 rounded">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm">
                  Click to expand
                </span>
                {onExecuteCell && rowId && columnId && (
                  <button
                    onClick={handleExecuteCell}
                    className="flex items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded shadow-sm transition-colors"
                    title="Execute AI task for this cell"
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </button>
                )}
              </div>
            </div>
          )}
          
          {/* Edit indicator and play button for expanded state */}
          {isExpanded && !isEditing && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background px-2 py-1 rounded shadow-sm">
                  <Edit3 className="h-3 w-3" />
                  Double-click to edit
                </div>
                {onExecuteCell && rowId && columnId && (
                  <button
                    onClick={handleExecuteCell}
                    className="flex items-center gap-1 text-xs text-green-600 bg-green-50 hover:bg-green-100 px-2 py-1 rounded shadow-sm transition-colors"
                    title="Execute AI task for this cell"
                  >
                    <Play className="h-3 w-3" />
                    Run
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 