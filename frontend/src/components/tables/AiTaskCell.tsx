'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface AiTaskCellProps {
  value: string;
  isLoading?: boolean;
  maxLength?: number;
}

export const AiTaskCell: React.FC<AiTaskCellProps> = ({ 
  value, 
  isLoading = false, 
  maxLength = 150 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-600">Generating...</span>
      </div>
    );
  }

  if (!value || value.trim().length === 0) {
    return (
      <span className="text-muted-foreground italic text-sm">
        No content generated
      </span>
    );
  }

  const needsTruncation = value.length > maxLength;
  const displayValue = needsTruncation && !isExpanded 
    ? value.substring(0, maxLength) + '...' 
    : value;

  return (
    <div className="space-y-2">
      <div className="text-sm leading-relaxed whitespace-pre-wrap">
        {displayValue}
      </div>
      
      {needsTruncation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-6 text-xs text-muted-foreground hover:text-foreground p-1"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Show more
            </>
          )}
        </Button>
      )}
    </div>
  );
}; 