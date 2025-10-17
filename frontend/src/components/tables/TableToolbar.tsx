/**
 * TableToolbar Component
 * 
 * Single-row toolbar for table operations, based on comp-485 design pattern.
 * Combines search, filter, webhooks, export, and column management into one clean row.
 * 
 * Features:
 * - Search input with icon
 * - Filter toggle button with active count
 * - Selected rows actions (delete)
 * - Incoming webhook configuration
 * - Export CSV and outbound webhook dropdown
 * - Add row and column buttons
 * 
 * @example
 * <TableToolbar
 *   searchQuery={searchQuery}
 *   onSearchChange={setSearchQuery}
 *   hasFilters={hasActiveFilters}
 *   activeFilterCount={filters.length}
 *   onToggleFilters={() => setShowFilters(!showFilters)}
 *   selectedCount={selectedRows.size}
 *   onDeleteSelected={handleDeleteRows}
 *   onAddRow={handleAddRow}
 *   onAddColumn={() => setIsAddColumnDialogOpen(true)}
 *   tableId={tableId}
 *   tableName={table.name}
 *   columns={table.columns || []}
 *   onExportCSV={handleExportCSV}
 * />
 */

'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Plus, Trash2 } from 'lucide-react';
import { IncomingWebhookButton } from '@/components/webhooks/IncomingWebhookButton';
import { OutboundWebhookButton } from '@/components/webhooks/OutboundWebhookButton';
import type { TableColumn } from '@/lib/api';

interface TableToolbarProps {
  // Search
  searchQuery: string;
  onSearchChange: (value: string) => void;
  
  // Filters
  hasFilters: boolean;
  activeFilterCount: number;
  onToggleFilters: () => void;
  
  // Selected rows actions
  selectedCount: number;
  onDeleteSelected?: () => void;
  
  // Table actions
  onAddRow: () => void;
  onAddColumn: () => void;
  
  // Export & Webhooks
  tableId: string;
  tableName: string;
  columns: TableColumn[];
  onExportCSV: () => void;
}

/**
 * TableToolbar Component
 * 
 * Provides a single-row control panel for table operations.
 * Designed following the comp-485 pattern with left-aligned controls
 * (search, filter) and right-aligned actions (webhooks, add buttons).
 */
export function TableToolbar({
  searchQuery,
  onSearchChange,
  hasFilters,
  activeFilterCount,
  onToggleFilters,
  selectedCount,
  onDeleteSelected,
  onAddRow,
  onAddColumn,
  tableId,
  tableName,
  columns,
  onExportCSV,
}: TableToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 border rounded-lg bg-card">
      {/* Left side: Search and Filter */}
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search table..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-64"
          />
        </div>
        
        {/* Filter Toggle Button */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={hasFilters ? 'border-blue-500 text-blue-600' : ''}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </Button>
      </div>

      {/* Right side: Actions */}
      <div className="flex items-center gap-2">
        {/* Delete Selected Rows */}
        {selectedCount > 0 && onDeleteSelected && (
          <Button variant="destructive" onClick={onDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete {selectedCount}
          </Button>
        )}
        
        {/* Incoming Webhook */}
        <IncomingWebhookButton
          tableId={tableId}
          tableName={tableName}
          columns={columns}
        />
        
        {/* Export & Outbound Webhooks */}
        <OutboundWebhookButton
          tableId={tableId}
          tableName={tableName}
          onExportCSV={onExportCSV}
        />
        
        {/* Add Row */}
        <Button onClick={onAddRow}>
          <Plus className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        
        {/* Add Column */}
        <Button variant="outline" onClick={onAddColumn}>
          <Plus className="h-4 w-4 mr-2" />
          Add Column
        </Button>
      </div>
    </div>
  );
}

export default TableToolbar;

