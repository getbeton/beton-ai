"use client";

import { Database, TableIcon, Check } from "lucide-react";

interface TableStatsProps {
  columns: number;
  totalRows: number;
  selectedRows: number;
}

/**
 * TableStats Component
 * 
 * Displays table statistics in a compact, inline format.
 * Based on comp-485 design patterns.
 * 
 * @param columns - Number of columns in the table
 * @param totalRows - Total number of rows in the table
 * @param selectedRows - Number of currently selected rows
 */
export function TableStats({ columns, totalRows, selectedRows }: TableStatsProps) {
  return (
    <div className="flex items-center gap-6 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <Database className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium text-foreground">{columns}</span>
        <span>Columns</span>
      </div>
      <div className="flex items-center gap-2">
        <TableIcon className="h-4 w-4" aria-hidden="true" />
        <span className="font-medium text-foreground">{totalRows}</span>
        <span>Total Rows</span>
      </div>
      {selectedRows > 0 && (
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4" aria-hidden="true" />
          <span className="font-medium text-foreground">{selectedRows}</span>
          <span>Selected</span>
        </div>
      )}
    </div>
  );
}

export default TableStats;

