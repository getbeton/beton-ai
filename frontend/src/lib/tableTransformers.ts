/**
 * Data transformation utilities for converting API table data to UI-compatible formats
 * 
 * This module provides type-safe transformers for converting between:
 * - UserTable (API response format from backend)
 * - TableItem (AdvancedTablesView component format)
 * 
 * @module tableTransformers
 */

import type { UserTable } from './api';
import type { TableItem } from '@/components/dashboard/AdvancedTablesView';

/**
 * Maps backend source types to UI-friendly source labels
 */
const SOURCE_TYPE_MAP: Record<string, TableItem['source']> = {
  apollo: 'Apollo',
  csv: 'CSV',
  manual: 'Manual',
} as const;

/**
 * Determines table status based on various table properties
 * 
 * Logic:
 * - If table is archived → 'error' (visual indicator)
 * - If table is newly created (< 5 seconds ago) → 'importing'
 * - If table has processing flag → 'processing'
 * - Default → 'ready'
 * 
 * @param table - UserTable from API response
 * @returns TableItem status
 */
export function determineTableStatus(table: UserTable): TableItem['status'] {
  // Check if table is archived (treat as error state for visibility)
  if (table.isArchived) {
    return 'error';
  }

  // Check if table was just created (within last 5 seconds) - likely still importing
  const now = new Date();
  const createdAt = new Date(table.createdAt);
  const ageInSeconds = (now.getTime() - createdAt.getTime()) / 1000;
  
  if (ageInSeconds < 5) {
    return 'importing';
  }

  // Check for processing flag (if backend adds this in the future)
  // @ts-ignore - processing field may not exist yet in UserTable type
  if (table.processing === true) {
    return 'processing';
  }

  // Default to ready state
  return 'ready';
}

/**
 * Transforms UserTable API response to TableItem format for AdvancedTablesView
 * 
 * Handles:
 * - Source type normalization (apollo/csv/manual → Apollo/CSV/Manual)
 * - Status inference from table state
 * - Safe handling of optional fields
 * - Default values for missing data
 * 
 * @param userTable - Table data from API response
 * @param ownerEmail - Optional owner email to display
 * @returns TableItem compatible with AdvancedTablesView
 */
export function transformUserTableToTableItem(
  userTable: UserTable,
  ownerEmail?: string
): TableItem {
  // Normalize source type with fallback to 'Manual'
  const sourceType = userTable.sourceType?.toLowerCase() || 'manual';
  const source = SOURCE_TYPE_MAP[sourceType] || 'Manual';

  // Extract row and column counts with safe defaults
  const rows = userTable._count?.rows || userTable.totalRows || 0;
  const columns = userTable._count?.columns || userTable.columns?.length || 0;

  // Determine status based on table state
  const status = determineTableStatus(userTable);

  // Use updatedAt as lastModified, fallback to createdAt
  const lastModified = new Date(userTable.updatedAt || userTable.createdAt);

  return {
    id: userTable.id,
    name: userTable.name,
    rows,
    columns,
    source,
    lastModified,
    status,
    description: userTable.description || undefined,
    owner: ownerEmail,
  };
}

/**
 * Transforms an array of UserTables to TableItems
 * 
 * Features:
 * - Batch transformation with consistent owner
 * - Automatic sorting by lastModified (descending)
 * - Filters out null/undefined entries
 * 
 * @param userTables - Array of UserTable from API
 * @param ownerEmail - Optional owner email for all tables
 * @returns Sorted array of TableItems
 */
export function transformUserTablesToTableItems(
  userTables: UserTable[],
  ownerEmail?: string
): TableItem[] {
  // Transform all tables
  const tableItems = userTables
    .filter(Boolean) // Remove any null/undefined entries
    .map((table) => transformUserTableToTableItem(table, ownerEmail));

  // Sort by lastModified descending (most recent first)
  tableItems.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());

  return tableItems;
}

/**
 * Updates a single TableItem in an array (for optimistic updates)
 * 
 * Use case: After editing a table, update it in the list without full refetch
 * 
 * @param tables - Current array of TableItems
 * @param updatedTable - Updated UserTable from API
 * @param ownerEmail - Optional owner email
 * @returns New array with updated table
 */
export function updateTableInList(
  tables: TableItem[],
  updatedTable: UserTable,
  ownerEmail?: string
): TableItem[] {
  const updatedItem = transformUserTableToTableItem(updatedTable, ownerEmail);
  
  return tables.map((table) =>
    table.id === updatedItem.id ? updatedItem : table
  );
}

/**
 * Adds a new table to the list (for optimistic inserts)
 * 
 * Use case: After creating a table, add it to the top of the list
 * 
 * @param tables - Current array of TableItems
 * @param newTable - New UserTable from API
 * @param ownerEmail - Optional owner email
 * @returns New array with new table at the top
 */
export function addTableToList(
  tables: TableItem[],
  newTable: UserTable,
  ownerEmail?: string
): TableItem[] {
  const newItem = transformUserTableToTableItem(newTable, ownerEmail);
  const updatedList = [newItem, ...tables];
  
  // Re-sort to ensure correct order
  updatedList.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  
  return updatedList;
}

/**
 * Removes a table from the list (for optimistic deletes)
 * 
 * Use case: After deleting a table, remove it immediately from the list
 * 
 * @param tables - Current array of TableItems
 * @param tableId - ID of table to remove
 * @returns New array without the deleted table
 */
export function removeTableFromList(
  tables: TableItem[],
  tableId: string
): TableItem[] {
  return tables.filter((table) => table.id !== tableId);
}

/**
 * Type guard to check if a value is a valid TableItem source
 */
export function isValidTableSource(source: string): source is TableItem['source'] {
  return source === 'CSV' || source === 'Apollo' || source === 'Manual';
}

/**
 * Type guard to check if a value is a valid TableItem status
 */
export function isValidTableStatus(status: string): status is TableItem['status'] {
  return status === 'processing' || status === 'ready' || status === 'error' || status === 'importing';
}

