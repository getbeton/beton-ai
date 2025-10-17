/**
 * TablesPageAdapter - Bridge component between page.tsx and AdvancedTablesView
 * 
 * Responsibilities:
 * - Fetch and transform table data from API
 * - Manage loading and error states
 * - Handle CRUD operations with optimistic updates
 * - Coordinate CSV upload and Apollo search flows
 * - Provide callbacks to AdvancedTablesView
 * 
 * @module TablesPageAdapter
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient, type UserTable } from '@/lib/api';
import type { TableItem } from './AdvancedTablesView';
import AdvancedTablesView from './AdvancedTablesView';
import AdvancedTablesViewSkeleton from './AdvancedTablesViewSkeleton';
import {
  transformUserTablesToTableItems,
  addTableToList,
  removeTableFromList,
  updateTableInList,
} from '@/lib/tableTransformers';
import toast from 'react-hot-toast';
import {
  showErrorWithRetry,
  createLoadingToast,
  updateLoadingToast,
} from '@/lib/utils';

/**
 * Props for TablesPageAdapter component
 */
interface TablesPageAdapterProps {
  /** Current user's email for owner display */
  userEmail?: string;
  /** Callback when CSV import is triggered */
  onImportCSV?: () => void;
  /** Callback when Apollo search is triggered */
  onSearchApollo?: () => void;
  /** Optional initial loading state */
  initialLoading?: boolean;
  /** Callback to expose adapter methods to parent */
  onAdapterReady?: (methods: TablesPageAdapterMethods) => void;
  /** Callback when table count changes (for empty state detection) */
  onTableCountChange?: (count: number) => void;
}

/**
 * Public methods exposed by TablesPageAdapter
 */
interface TablesPageAdapterMethods {
  /** Refresh table list from API */
  refetch: () => void;
  /** Add a newly uploaded table to the list */
  addNewTable: (table: UserTable) => void;
  /** Update an existing table in the list */
  updateExistingTable: (table: UserTable) => void;
}

/**
 * TablesPageAdapter Component
 * 
 * Acts as a data layer between the page and AdvancedTablesView,
 * handling all API interactions and state management.
 */
export default function TablesPageAdapter({
  userEmail,
  onImportCSV,
  onSearchApollo,
  initialLoading = true,
  onAdapterReady,
  onTableCountChange,
}: TablesPageAdapterProps) {
  const router = useRouter();
  
  // State management
  const [tables, setTables] = useState<TableItem[]>([]);
  const [loading, setLoading] = useState(initialLoading);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  /**
   * Fetches tables from API and transforms them to TableItem format
   * 
   * Features:
   * - Error handling with retry capability
   * - Automatic data transformation
   * - Loading state management
   */
  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tables from API
      const response = await apiClient.tables.list();
      
      if (response.data.success) {
        // Transform UserTable[] to TableItem[]
        const transformedTables = transformUserTablesToTableItems(
          response.data.data,
          userEmail
        );
        
        setTables(transformedTables);
      } else {
        throw new Error('Failed to fetch tables');
      }
    } catch (err) {
      console.error('[TablesPageAdapter] Error fetching tables:', err);
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      
      // Show error with retry option
      showErrorWithRetry(error, {
        operation: 'load tables',
        retry: () => setRefetchTrigger((prev) => prev + 1),
      });
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  /**
   * Effect: Fetch tables on mount and when refetch is triggered
   */
  useEffect(() => {
    fetchTables();
  }, [fetchTables, refetchTrigger]);

  /**
   * Triggers a refetch of table data
   * 
   * Use case: After bulk operations, external updates, etc.
   */
  const refetch = useCallback(() => {
    setRefetchTrigger((prev) => prev + 1);
  }, []);

  /**
   * Handler: View table details
   * 
   * Navigates to table detail page
   */
  const handleViewTable = useCallback(
    (tableId: string) => {
      console.info(`[TablesPageAdapter] Navigating to table: ${tableId}`);
      router.push(`/dashboard/tables/${tableId}`);
    },
    [router]
  );

  /**
   * Handler: Edit table
   * 
   * Navigates to table edit page
   * Note: Edit page may not exist yet - will be created in future commit
   */
  const handleEditTable = useCallback(
    (tableId: string) => {
      console.info(`[TablesPageAdapter] Editing table: ${tableId}`);
      // For now, navigate to table detail page
      // TODO: Create dedicated edit page
      router.push(`/dashboard/tables/${tableId}`);
    },
    [router]
  );

  /**
   * Handler: Duplicate table
   * 
   * Creates a copy of the table with "(Copy)" suffix
   * Uses optimistic update pattern
   */
  const handleDuplicateTable = useCallback(
    async (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) {
        console.warn(`[TablesPageAdapter] Table not found: ${tableId}`);
        return;
      }

      const toastId = createLoadingToast(`Duplicating ${table.name}...`);

      try {
        // TODO: Replace with actual duplicate API when available
        // For now, create a new table with copied data
        console.info(`[TablesPageAdapter] Duplicating table: ${tableId}`);
        
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Create mock duplicated table (will be replaced with real API)
        const duplicatedTable: UserTable = {
          id: `${tableId}_copy_${Date.now()}`,
          name: `${table.name} (Copy)`,
          description: table.description || `Copy of ${table.name}`,
          sourceType: table.source.toLowerCase() as 'apollo' | 'csv' | 'manual',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isArchived: false,
          userId: '',
          _count: {
            rows: table.rows,
            columns: table.columns,
          },
        };

        // Optimistically add to list
        setTables((prevTables) =>
          addTableToList(prevTables, duplicatedTable, userEmail)
        );

        updateLoadingToast(
          toastId,
          'success',
          `${table.name} duplicated successfully!`
        );
      } catch (err) {
        console.error('[TablesPageAdapter] Duplicate failed:', err);
        updateLoadingToast(
          toastId,
          'error',
          `Failed to duplicate ${table.name}`
        );
        
        showErrorWithRetry(err as Error, {
          operation: 'duplicate table',
          entityName: table.name,
          retry: () => handleDuplicateTable(tableId),
        });
      }
    },
    [tables, userEmail]
  );

  /**
   * Handler: Delete table
   * 
   * Deletes table with confirmation and optimistic update
   * Includes rollback on API failure
   */
  const handleDeleteTable = useCallback(
    async (tableId: string) => {
      const table = tables.find((t) => t.id === tableId);
      if (!table) {
        console.warn(`[TablesPageAdapter] Table not found: ${tableId}`);
        return;
      }

      // Confirmation dialog
      const confirmed = window.confirm(
        `Are you sure you want to delete "${table.name}"? This action cannot be undone.`
      );

      if (!confirmed) {
        return;
      }

      const toastId = createLoadingToast(`Deleting ${table.name}...`);

      // Store original list for rollback
      const originalTables = tables;

      try {
        // Optimistic update: remove immediately
        setTables((prevTables) => removeTableFromList(prevTables, tableId));

        console.info(`[TablesPageAdapter] Deleting table: ${tableId}`);
        
        // API call
        const response = await apiClient.tables.delete(tableId);

        if (!response.data.success) {
          throw new Error('Delete request failed');
        }

        updateLoadingToast(
          toastId,
          'success',
          `${table.name} deleted successfully`
        );
      } catch (err) {
        console.error('[TablesPageAdapter] Delete failed:', err);
        
        // Rollback: restore original list
        setTables(originalTables);
        
        updateLoadingToast(
          toastId,
          'error',
          `Failed to delete ${table.name}`
        );

        showErrorWithRetry(err as Error, {
          operation: 'delete table',
          entityName: table.name,
          retry: () => handleDeleteTable(tableId),
        });
      }
    },
    [tables]
  );

  /**
   * Handler: Import CSV
   * 
   * Delegates to parent component's CSV import handler
   */
  const handleImportCSV = useCallback(() => {
    console.info('[TablesPageAdapter] CSV import triggered');
    if (onImportCSV) {
      onImportCSV();
    } else {
      toast('CSV import will be available soon.');
    }
  }, [onImportCSV]);

  /**
   * Handler: Search Apollo
   * 
   * Delegates to parent component's Apollo search handler
   */
  const handleSearchApollo = useCallback(() => {
    console.info('[TablesPageAdapter] Apollo search triggered');
    if (onSearchApollo) {
      onSearchApollo();
    } else {
      toast('Apollo search will be available soon.');
    }
  }, [onSearchApollo]);

  /**
   * Public method: Add new table to list
   * 
   * Use case: After successful CSV upload, add table immediately
   */
  const addNewTable = useCallback(
    (newTable: UserTable) => {
      console.info(`[TablesPageAdapter] Adding new table: ${newTable.name}`);
      setTables((prevTables) => addTableToList(prevTables, newTable, userEmail));
    },
    [userEmail]
  );

  /**
   * Public method: Update existing table in list
   * 
   * Use case: After editing table metadata
   */
  const updateExistingTable = useCallback(
    (updatedTable: UserTable) => {
      console.info(`[TablesPageAdapter] Updating table: ${updatedTable.id}`);
      setTables((prevTables) =>
        updateTableInList(prevTables, updatedTable, userEmail)
      );
    },
    [userEmail]
  );

  /**
   * Effect: Expose public methods to parent component
   * 
   * Allows parent to control adapter (e.g., add tables after CSV upload)
   */
  useEffect(() => {
    if (onAdapterReady) {
      const methods: TablesPageAdapterMethods = {
        refetch,
        addNewTable,
        updateExistingTable,
      };
      onAdapterReady(methods);
    }
  }, [onAdapterReady, refetch, addNewTable, updateExistingTable]);

  /**
   * Effect: Notify parent when table count changes
   * 
   * This allows parent to switch between empty state and tables view
   * when the last table is deleted or first table is added
   */
  useEffect(() => {
    if (onTableCountChange) {
      onTableCountChange(tables.length);
    }
  }, [tables.length, onTableCountChange]);

  // Render loading state with skeleton
  if (loading && tables.length === 0) {
    return <AdvancedTablesViewSkeleton rows={5} />;
  }

  // Render error state
  if (error && tables.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-4">
          <div className="text-destructive text-lg font-semibold">
            Failed to load tables
          </div>
          <p className="text-muted-foreground">{error.message}</p>
          <button
            onClick={() => setRefetchTrigger((prev) => prev + 1)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render AdvancedTablesView with all handlers
  return (
    <AdvancedTablesView
      tables={tables}
      onImportCSV={handleImportCSV}
      onSearchApollo={handleSearchApollo}
      onViewTable={handleViewTable}
      onEditTable={handleEditTable}
      onDuplicateTable={handleDuplicateTable}
      onDeleteTable={handleDeleteTable}
    />
  );
}

// Export types for use in parent components
export type { TablesPageAdapterProps, TablesPageAdapterMethods };

