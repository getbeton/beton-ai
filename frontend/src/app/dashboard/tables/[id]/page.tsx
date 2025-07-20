'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable, type TableColumn, type CreateColumnRequest, type Integration } from '@/lib/api';
import { TableCellRenderer } from '@/components/tables/TableCellRenderer';
import { useAiTaskCells } from '@/hooks/useAiTaskCells';
import { 
  Plus,
  Table as TableIcon,
  Search,
  Download,
  Edit3,
  Trash2,
  Check,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  Loader2,
  AlertCircle,
  MoreHorizontal,
  ExternalLink,
  Database,
  Filter,
  FilterX
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';

const COLUMN_TYPES = [
  { value: 'text', label: 'Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'currency', label: 'Currency', icon: '💰' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'url', label: 'URL', icon: '🔗' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
  { value: 'ai_task', label: 'AI Task', icon: '🤖' }
];

const FILTER_CONDITIONS = {
  text: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
    { value: 'lessThanOrEqual', label: 'Less than or equal' },
    { value: 'between', label: 'Between' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  currency: [
    { value: 'equals', label: 'Equals' },
    { value: 'greaterThan', label: 'Greater than' },
    { value: 'lessThan', label: 'Less than' },
    { value: 'greaterThanOrEqual', label: 'Greater than or equal' },
    { value: 'lessThanOrEqual', label: 'Less than or equal' },
    { value: 'between', label: 'Between' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  date: [
    { value: 'equals', label: 'Is on' },
    { value: 'before', label: 'Is before' },
    { value: 'after', label: 'Is after' },
    { value: 'between', label: 'Is between' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  email: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  url: [
    { value: 'contains', label: 'Contains' },
    { value: 'equals', label: 'Equals' },
    { value: 'startsWith', label: 'Starts with' },
    { value: 'endsWith', label: 'Ends with' },
    { value: 'isEmpty', label: 'Is empty' },
    { value: 'isNotEmpty', label: 'Is not empty' }
  ],
  checkbox: [
    { value: 'isTrue', label: 'Is checked' },
    { value: 'isFalse', label: 'Is unchecked' }
  ]
};

interface EditableCell {
  rowId: string;
  columnId: string;
  value: string;
}

interface TableFilter {
  id: string;
  columnId: string;
  columnName: string;
  columnType: string;
  condition: string;
  value: string;
  value2?: string; // For between conditions
}

export default function TableViewPage() {
  const params = useParams();
  const tableId = params.id as string;
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [table, setTable] = useState<UserTable | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<EditableCell | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [allRowsSelected, setAllRowsSelected] = useState(false);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [filters, setFilters] = useState<TableFilter[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [newFilter, setNewFilter] = useState<Partial<TableFilter>>({});
  
  // Dialog states
  const [isAddColumnDialogOpen, setIsAddColumnDialogOpen] = useState(false);
  const [isEditColumnDialogOpen, setIsEditColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<TableColumn | null>(null);
  
  // AI Task execution states
  const [isExecuteAiTaskDialogOpen, setIsExecuteAiTaskDialogOpen] = useState(false);
  const [executingColumn, setExecutingColumn] = useState<TableColumn | null>(null);
  const [executionScope, setExecutionScope] = useState<'column' | 'selected_rows' | 'single_row' | 'single_cell'>('column');
  const [executionIntegrationId, setExecutionIntegrationId] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionJobId, setExecutionJobId] = useState<string | null>(null);
  
  // AI Task cells hook for real-time updates
  const aiTaskCells = useAiTaskCells({
    userId: user?.id,
    onCellUpdate: (cellId, value) => {
      console.log(`Cell ${cellId} updated with value:`, value);
      // Optionally refresh table data
      fetchTable();
    }
  });
  
  // Form states
  const [newColumn, setNewColumn] = useState<CreateColumnRequest>({
    name: '',
    type: 'text',
    isRequired: false,
    isEditable: true,
    defaultValue: '',
    settings: {}
  });
  
  // AI Task specific states
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);
  const [loadingIntegrations, setLoadingIntegrations] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
        await fetchTable();
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router, tableId]);

  // Fetch integrations and variables when dialog opens
  useEffect(() => {
    if (isAddColumnDialogOpen || isEditColumnDialogOpen) {
      fetchIntegrations();
      fetchAvailableVariables();
    }
  }, [isAddColumnDialogOpen, isEditColumnDialogOpen]);

  // Reset AI task settings when column type changes
  useEffect(() => {
    if (newColumn.type !== 'ai_task') {
      setNewColumn(prev => ({
        ...prev,
        settings: {}
      }));
    } else {
      // Initialize AI task settings
      setNewColumn(prev => ({
        ...prev,
        settings: {
          aiTask: {
            prompt: '',
            useCase: 'content_creation',
            modelConfig: {}
          }
        }
      }));
    }
  }, [newColumn.type]);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refetch table when filters, search, pagination, or sorting changes
  useEffect(() => {
    if (user && table) {
      fetchTable();
    }
  }, [currentPage, rowsPerPage, sortColumn, sortDirection, debouncedSearchQuery, filters]);

  const fetchTable = async () => {
    try {
      // Convert our frontend filters to backend format
      const backendFilters = filters.map(filter => ({
        columnId: filter.columnId,
        condition: filter.condition,
        value: filter.value,
        value2: filter.value2
      }));

      const response = await apiClient.tables.get(tableId, {
        page: currentPage,
        limit: rowsPerPage,
        sortBy: sortColumn,
        sortOrder: sortDirection,
        search: debouncedSearchQuery || undefined,
        filters: backendFilters.length > 0 ? backendFilters : undefined
      });
      
      if (response.data.success) {
        setTable(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching table:', error);
      toast.error('Failed to load table');
    }
  };

  const handleCellEdit = async (rowId: string, columnId: string, value: string) => {
    try {
      const response = await apiClient.tables.updateCell(tableId, rowId, columnId, value);
      if (response.data.success) {
        // Update the local state
        setTable(prev => {
          if (!prev?.formattedRows) return prev;
          return {
            ...prev,
            formattedRows: prev.formattedRows.map(row => 
              row.id === rowId 
                ? { ...row, [prev.columns?.find(col => col.id === columnId)?.name || '']: value }
                : row
            )
          };
        });
        toast.success('Cell updated');
      }
    } catch (error: any) {
      console.error('Error updating cell:', error);
      toast.error('Failed to update cell');
    }
  };

  const fetchIntegrations = async () => {
    setLoadingIntegrations(true);
    try {
      const response = await apiClient.integrations.list();
      if (response.data.success) {
        // Filter for active LLM integrations (OpenAI, etc.)
        const llmIntegrations = response.data.data.filter(
          (integration: Integration) => 
            integration.isActive && 
            ['openai'].includes(integration.serviceName)
        );
        setIntegrations(llmIntegrations);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    } finally {
      setLoadingIntegrations(false);
    }
  };

  const fetchAvailableVariables = async () => {
    try {
      const response = await apiClient.aiTasks.getAvailableVariables(tableId);
      if (response.data.success) {
        setAvailableVariables(response.data.data.variables);
      }
    } catch (error) {
      console.error('Error fetching available variables:', error);
    }
  };

  const handleOpenEditColumn = (column: TableColumn) => {
    setEditingColumn(column);
    setNewColumn({
      name: column.name,
      type: column.type as any,
      isRequired: column.isRequired,
      isEditable: column.isEditable,
      defaultValue: column.defaultValue || '',
      settings: column.settings || {}
    });
    setIsEditColumnDialogOpen(true);
  };

  const handleAddColumn = async () => {
    if (!newColumn.name.trim()) {
      toast.error('Column name is required');
      return;
    }

    // Validate AI task configuration
    if (newColumn.type === 'ai_task') {
      if (!newColumn.settings?.aiTask?.prompt?.trim()) {
        toast.error('Prompt is required for AI task columns');
        return;
      }
      if (!newColumn.settings?.aiTask?.useCase) {
        toast.error('Use case is required for AI task columns');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await apiClient.tables.addColumn(tableId, newColumn);
      if (response.data.success) {
        toast.success('Column added successfully');
        setIsAddColumnDialogOpen(false);
        setNewColumn({
          name: '',
          type: 'text',
          isRequired: false,
          isEditable: true,
          defaultValue: '',
          settings: {}
        });
        await fetchTable();
      }
    } catch (error: any) {
      console.error('Error adding column:', error);
      toast.error(error.response?.data?.error || 'Failed to add column');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditColumn = async () => {
    if (!editingColumn || !newColumn.name.trim()) {
      toast.error('Column name is required');
      return;
    }

    // Validate AI task configuration
    if (newColumn.type === 'ai_task') {
      if (!newColumn.settings?.aiTask?.prompt?.trim()) {
        toast.error('Prompt is required for AI task columns');
        return;
      }
      if (!newColumn.settings?.aiTask?.useCase) {
        toast.error('Use case is required for AI task columns');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await apiClient.tables.updateColumn(tableId, editingColumn.id, newColumn);
      if (response.data.success) {
        toast.success('Column updated successfully');
        setIsEditColumnDialogOpen(false);
        setEditingColumn(null);
        setNewColumn({
          name: '',
          type: 'text',
          isRequired: false,
          isEditable: true,
          defaultValue: '',
          settings: {}
        });
        await fetchTable();
      }
    } catch (error: any) {
      console.error('Error updating column:', error);
      toast.error(error.response?.data?.error || 'Failed to update column');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAiTaskExecution = (column: TableColumn, scope: 'column' | 'selected_rows' | 'single_row' | 'single_cell' = 'column') => {
    if (column.type !== 'ai_task') return;
    
    setExecutingColumn(column);
    setExecutionScope(scope);
    
    // Set default integration if configured in column
    const defaultIntegration = column.settings?.aiTask?.integrationId;
    setExecutionIntegrationId(defaultIntegration || (integrations.length > 0 ? integrations[0].id : ''));
    
    setIsExecuteAiTaskDialogOpen(true);
  };

  const handleExecuteAiTask = async () => {
    if (!executingColumn || !executionIntegrationId) {
      toast.error('Please select an integration');
      return;
    }

    // Validate scope requirements
    if (executionScope === 'selected_rows' && selectedRows.size === 0) {
      toast.error('Please select rows to execute AI task on');
      return;
    }

    let targetRowIds: string[] = [];
    let targetCellId: string | undefined;

    // Determine target based on scope
    switch (executionScope) {
      case 'column':
        // All rows in the column - no specific targeting needed
        break;
      case 'selected_rows':
        targetRowIds = Array.from(selectedRows);
        break;
      case 'single_row':
        if (table?.formattedRows && table.formattedRows.length > 0) {
          targetRowIds = [table.formattedRows[0].id]; // For demo, use first row
        }
        break;
      case 'single_cell':
        // For demo, target first cell in the column
        if (table?.formattedRows && table.formattedRows.length > 0) {
          const firstRow = table.formattedRows[0];
          // Need to find the cell ID for this column and row
          targetCellId = `${firstRow.id}_${executingColumn.id}`; // This might need adjustment based on actual cell ID structure
        }
        break;
    }

    setIsExecuting(true);
    try {
      const executeRequest = {
        tableId,
        columnId: executingColumn.id,
        integrationId: executionIntegrationId,
        executionScope,
        targetRowIds: targetRowIds.length > 0 ? targetRowIds : undefined,
        targetCellId
      };

      const response = await apiClient.aiTasks.execute(executeRequest);
      if (response.data.success) {
        setExecutionJobId(response.data.data.jobId);
        toast.success('AI task execution started! Check the Jobs dashboard for progress.');
        setIsExecuteAiTaskDialogOpen(false);
        
        // Reset execution state
        setExecutingColumn(null);
        setExecutionIntegrationId('');
        setExecutionScope('column');
      }
    } catch (error: any) {
      console.error('Error executing AI task:', error);
      toast.error(error.response?.data?.error || 'Failed to execute AI task');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleDeleteColumn = async (columnId: string, columnName: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${columnName}" column? This will remove all data in this column.`)) {
      return;
    }

    try {
      const response = await apiClient.tables.deleteColumn(tableId, columnId);
      if (response.data.success) {
        toast.success('Column deleted successfully');
        await fetchTable();
      }
    } catch (error: any) {
      console.error('Error deleting column:', error);
      toast.error('Failed to delete column');
    }
  };

  const handleAddRow = async () => {
    const defaultData: Record<string, any> = {};
    table?.columns?.forEach(column => {
      defaultData[column.name] = column.defaultValue || '';
    });

    try {
      const response = await apiClient.tables.addRow(tableId, defaultData);
      if (response.data.success) {
        toast.success('Row added');
        await fetchTable();
      }
    } catch (error: any) {
      console.error('Error adding row:', error);
      toast.error('Failed to add row');
    }
  };

  const handleDeleteRows = async () => {
    if (selectedRows.size === 0) {
      toast.error('No rows selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedRows.size} row(s)? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    try {
      const deletePromises = Array.from(selectedRows).map(rowId =>
        apiClient.tables.deleteRow(tableId, rowId)
      );
      
      await Promise.all(deletePromises);
      toast.success(`${selectedRows.size} row(s) deleted`);
      setSelectedRows(new Set());
      setAllRowsSelected(false);
      await fetchTable();
    } catch (error: any) {
      console.error('Error deleting rows:', error);
      toast.error('Failed to delete rows');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRowSelect = (rowId: string, checked: boolean) => {
    const newSelectedRows = new Set(selectedRows);
    if (checked) {
      newSelectedRows.add(rowId);
    } else {
      newSelectedRows.delete(rowId);
    }
    setSelectedRows(newSelectedRows);
    setAllRowsSelected(newSelectedRows.size === (table?.formattedRows?.length || 0));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allRowIds = new Set(table?.formattedRows?.map(row => row.id) || []);
      setSelectedRows(allRowIds);
    } else {
      setSelectedRows(new Set());
    }
    setAllRowsSelected(checked);
  };

  const handleSort = (columnName: string) => {
    if (sortColumn === columnName) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnName);
      setSortDirection('asc');
    }
  };

  // Server-side filtering - no client-side filtering functions needed

  const addFilter = () => {
    if (!newFilter.columnId || !newFilter.condition) {
      toast.error('Please select a column and condition');
      return;
    }

    const column = table?.columns?.find(col => col.id === newFilter.columnId);
    if (!column) return;

    // Check if value is required for this condition
    const requiresValue = !['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(newFilter.condition);
    if (requiresValue && !newFilter.value?.trim()) {
      toast.error('Please enter a filter value');
      return;
    }

    const filter: TableFilter = {
      id: Date.now().toString(),
      columnId: newFilter.columnId,
      columnName: column.name,
      columnType: column.type,
      condition: newFilter.condition!,
      value: newFilter.value || '',
      value2: newFilter.value2
    };

    setFilters(prev => [...prev, filter]);
    setNewFilter({});
    setShowAddFilter(false);
    setCurrentPage(1); // Reset to first page when adding filter
    toast.success('Filter added');
  };

  const updateFilter = (filterId: string, updates: Partial<TableFilter>) => {
    setFilters(prev => prev.map(filter => 
      filter.id === filterId ? { ...filter, ...updates } : filter
    ));
  };

  const removeFilter = (filterId: string) => {
    setFilters(prev => prev.filter(filter => filter.id !== filterId));
    setCurrentPage(1); // Reset to first page when removing filter
    toast.success('Filter removed');
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setFilters([]);
    setShowFilters(false);
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const hasActiveFilters = debouncedSearchQuery || filters.length > 0;

  const handleExportCSV = () => {
    // Use the current server-filtered data directly
    const rowsToExport = table?.formattedRows || [];
    
    if (rowsToExport.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = table?.columns?.map(col => col.name) || [];
    const csvData = rowsToExport.map(row => {
      return headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : `"${value || ''}"`;
      });
    });

    const csvContent = [
      headers.map(h => `"${h}"`).join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${table?.name || 'table'}-filtered-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    const filterInfo = hasActiveFilters ? 'filtered ' : '';
    toast.success(`Exported ${rowsToExport.length} ${filterInfo}rows successfully!`);
  };

  const renderCellValue = (row: any, column: TableColumn) => {
    const value = row[column.name];
    
    if (editingCell?.rowId === row.id && editingCell?.columnId === column.id) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCellEdit(row.id, column.id, editingCell.value);
                setEditingCell(null);
              } else if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
            className="h-8"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => {
              handleCellEdit(row.id, column.id, editingCell.value);
              setEditingCell(null);
            }}
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={() => setEditingCell(null)}
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      );
    }

    const cellContent = (() => {
      switch (column.type) {
        case 'checkbox':
          return (
            <Checkbox 
              checked={value === 'true' || value === true}
              onCheckedChange={(checked) => handleCellEdit(row.id, column.id, String(checked))}
            />
          );
        case 'url':
          return value ? (
            <a 
              href={value} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              {value}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : '';
        case 'email':
          return value ? (
            <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
              {value}
            </a>
          ) : '';
        case 'currency':
          return value ? `$${parseFloat(value).toFixed(2)}` : '';
        case 'date':
          return value ? new Date(value).toLocaleDateString() : '';
        default:
          return value || '';
      }
    })();

    return (
      <div 
        className="cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] flex items-center"
        onClick={() => {
          if (column.isEditable && column.type !== 'checkbox') {
            setEditingCell({
              rowId: row.id,
              columnId: column.id,
              value: String(value || '')
            });
          }
        }}
      >
        {cellContent}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!table) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Table Not Found</h3>
              <p className="text-muted-foreground mb-4">
                The table you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button onClick={() => router.push('/dashboard/tables')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tables
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Head>
        <title>{table.name} - Table Details - Beton-AI</title>
        <meta name="description" content={`View and manage data in ${table.name} table. ${table.description || 'Edit table structure, add rows, and manage data.'}`} />
      </Head>
      
      <Toaster position="top-right" />

      {/* Breadcrumb Navigation */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <BreadcrumbNavigation tableName={table.name} />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/tables')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tables
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <TableIcon className="h-8 w-8" />
                {table.name}
              </h1>
              <p className="text-muted-foreground">
                {table.description || 'No description'}
              </p>
            </div>
          </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{table.columns?.length || 0}</div>
                <div className="text-sm text-muted-foreground">Columns</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TableIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{table.totalRows || 0}</div>
                <div className="text-sm text-muted-foreground">Total Rows</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{selectedRows.size}</div>
                <div className="text-sm text-muted-foreground">Selected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar */}
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search table..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters {hasActiveFilters && `(${filters.length + (searchQuery ? 1 : 0)})`}
            </Button>
            
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearAllFilters}>
                <FilterX className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {selectedRows.size > 0 && (
              <Button variant="destructive" onClick={handleDeleteRows}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete {selectedRows.size} row(s)
              </Button>
            )}
            
            <Button onClick={handleAddRow}>
              <Plus className="h-4 w-4 mr-2" />
              Add Row
            </Button>
            
            <Button variant="outline" onClick={() => setIsAddColumnDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Column
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Existing Filters */}
                {filters.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Active Filters:</h4>
                    {filters.map((filter) => (
                      <div key={filter.id} className="flex items-center gap-2 p-2 border rounded-lg bg-muted/50">
                        <span className="text-sm font-medium">{filter.columnName}</span>
                        <span className="text-sm text-muted-foreground">
                          {FILTER_CONDITIONS[filter.columnType as keyof typeof FILTER_CONDITIONS]?.find(c => c.value === filter.condition)?.label}
                        </span>
                        {!['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(filter.condition) && (
                          <Input
                            placeholder="Value"
                            value={filter.value}
                            onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                            className="h-7 w-32"
                          />
                        )}
                        {filter.condition === 'between' && (
                          <Input
                            placeholder="To"
                            value={filter.value2 || ''}
                            onChange={(e) => updateFilter(filter.id, { value2: e.target.value })}
                            className="h-7 w-32"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => removeFilter(filter.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Filter */}
                {!showAddFilter ? (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowAddFilter(true)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Filter
                  </Button>
                ) : (
                  <div className="space-y-3 p-4 border rounded-lg bg-background">
                    <h4 className="text-sm font-medium">Add New Filter:</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {/* Column Selection */}
                      <div>
                        <Label className="text-xs">Column</Label>
                        <select
                          value={newFilter.columnId || ''}
                          onChange={(e) => {
                            const column = table?.columns?.find(col => col.id === e.target.value);
                            setNewFilter(prev => ({
                              ...prev,
                              columnId: e.target.value,
                              columnType: column?.type,
                              condition: undefined,
                              value: '',
                              value2: ''
                            }));
                          }}
                          className="w-full h-9 px-3 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="">Select column...</option>
                          {table?.columns?.map((column) => (
                            <option key={column.id} value={column.id}>
                              {COLUMN_TYPES.find(t => t.value === column.type)?.icon} {column.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Condition Selection */}
                      <div>
                        <Label className="text-xs">Condition</Label>
                        <select
                          value={newFilter.condition || ''}
                          onChange={(e) => setNewFilter(prev => ({ ...prev, condition: e.target.value }))}
                          disabled={!newFilter.columnType}
                          className="w-full h-9 px-3 border border-input bg-background rounded-md text-sm disabled:opacity-50"
                        >
                          <option value="">Select condition...</option>
                          {newFilter.columnType && FILTER_CONDITIONS[newFilter.columnType as keyof typeof FILTER_CONDITIONS]?.map((condition) => (
                            <option key={condition.value} value={condition.value}>
                              {condition.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Value Input */}
                      {newFilter.condition && !['isEmpty', 'isNotEmpty', 'isTrue', 'isFalse'].includes(newFilter.condition) && (
                        <div>
                          <Label className="text-xs">Value</Label>
                          <Input
                            placeholder="Enter value..."
                            value={newFilter.value || ''}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, value: e.target.value }))}
                            type={newFilter.columnType === 'number' || newFilter.columnType === 'currency' ? 'number' : 
                                  newFilter.columnType === 'date' ? 'date' : 'text'}
                            className="h-9"
                          />
                        </div>
                      )}

                      {/* Second Value for Between */}
                      {newFilter.condition === 'between' && (
                        <div>
                          <Label className="text-xs">To Value</Label>
                          <Input
                            placeholder="Enter end value..."
                            value={newFilter.value2 || ''}
                            onChange={(e) => setNewFilter(prev => ({ ...prev, value2: e.target.value }))}
                            type={newFilter.columnType === 'number' || newFilter.columnType === 'currency' ? 'number' : 
                                  newFilter.columnType === 'date' ? 'date' : 'text'}
                            className="h-9"
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={addFilter} size="sm">
                        Add Filter
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowAddFilter(false);
                          setNewFilter({});
                        }}
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={allRowsSelected}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  {table.columns?.map((column) => (
                    <TableHead key={column.id} className="min-w-[150px]">
                      <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">
                            {COLUMN_TYPES.find(t => t.value === column.type)?.icon}
                          </span>
                          <span>{column.name}</span>
                          {column.isRequired && (
                            <span className="text-red-500">*</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleSort(column.name)}
                          >
                            {sortColumn === column.name ? (
                              sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3" />
                            )}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleOpenEditColumn(column)}>
                                <Edit3 className="h-4 w-4 mr-2" />
                                Edit Column
                              </DropdownMenuItem>
                              {column.type === 'ai_task' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => handleOpenAiTaskExecution(column, 'column')}>
                                    <span className="mr-2">🤖</span>
                                    Execute AI Task (All Rows)
                                  </DropdownMenuItem>
                                  {selectedRows.size > 0 && (
                                    <DropdownMenuItem onClick={() => handleOpenAiTaskExecution(column, 'selected_rows')}>
                                      <span className="mr-2">✅</span>
                                      Execute AI Task (Selected Rows)
                                    </DropdownMenuItem>
                                  )}
                                </>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteColumn(column.id, column.name)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Column
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {(table.formattedRows || []).map((row) => (
                  <TableRow key={row.id} className={selectedRows.has(row.id) ? 'bg-muted/50' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRows.has(row.id)}
                        onCheckedChange={(checked) => handleRowSelect(row.id, !!checked)}
                      />
                    </TableCell>
                    {table.columns?.map((column) => (
                      <TableCell key={`${row.id}-${column.id}`} className="relative group">
                        {renderCellValue(row, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {(() => {
            const currentRows = table.formattedRows || [];
            const hasData = table.totalRows && table.totalRows > 0;
            
            if (!hasData) {
              return (
                <div className="text-center py-12">
                  <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data</h3>
                  <p className="text-muted-foreground mb-4">
                    This table is empty. Add some rows to get started.
                  </p>
                  <Button onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Row
                  </Button>
                </div>
              );
            }
            
            if (currentRows.length === 0 && hasActiveFilters) {
              return (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Matching Results</h3>
                  <p className="text-muted-foreground mb-4">
                    No rows match your current filters. Try adjusting your search criteria.
                  </p>
                  <Button variant="outline" onClick={clearAllFilters}>
                    <FilterX className="h-4 w-4 mr-2" />
                    Clear All Filters
                  </Button>
                </div>
              );
            }
            
            return null;
          })()}
        </CardContent>
      </Card>

      {/* Pagination */}
      {table.pagination && table.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, table.totalRows || 0)} of {table.totalRows} {hasActiveFilters ? 'filtered ' : ''}rows
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
            >
              Previous
            </Button>
            
            <span className="text-sm">
              Page {currentPage} of {table.pagination.totalPages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage >= table.pagination.totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Column Dialog */}
      <Dialog open={isAddColumnDialogOpen} onOpenChange={setIsAddColumnDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
            <DialogDescription>
              Add a new column to your table.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="column-name">Column Name *</Label>
              <Input
                id="column-name"
                placeholder="Enter column name"
                value={newColumn.name}
                onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="column-type">Column Type</Label>
              <Select value={newColumn.type} onValueChange={(value: any) => setNewColumn(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Task Configuration */}
            {newColumn.type === 'ai_task' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h4 className="font-medium">AI Task Configuration</h4>
                </div>

                <div>
                  <Label htmlFor="ai-prompt">Prompt Template *</Label>
                  <Textarea
                    id="ai-prompt"
                    placeholder="Enter your prompt template. Use {{column_name}} to reference other columns..."
                    value={newColumn.settings?.aiTask?.prompt || ''}
                    onChange={(e) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          prompt: e.target.value
                        }
                      }
                    }))}
                    rows={4}
                    className="resize-none"
                  />
                  {availableVariables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Available variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {availableVariables.map((variable) => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => {
                              const currentPrompt = newColumn.settings?.aiTask?.prompt || '';
                              const newPrompt = currentPrompt + `{{${variable}}}`;
                              setNewColumn(prev => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  aiTask: {
                                    ...prev.settings?.aiTask,
                                    prompt: newPrompt
                                  }
                                }
                              }));
                            }}
                            className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded border"
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="ai-use-case">Use Case</Label>
                  <Select 
                    value={newColumn.settings?.aiTask?.useCase || 'content_creation'}
                    onValueChange={(value) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          useCase: value
                        }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content_creation">Content Creation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="ai-integration">Default Integration (Optional)</Label>
                  <Select 
                    value={newColumn.settings?.aiTask?.integrationId || 'none'}
                    onValueChange={(value) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          integrationId: value === 'none' ? undefined : value
                        }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration (can be overridden later)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default (select during execution)</SelectItem>
                      {loadingIntegrations ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading integrations...
                        </SelectItem>
                      ) : (
                        integrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center gap-2">
                              <span>🤖</span>
                              <span>{integration.name}</span>
                              <span className="text-xs text-muted-foreground">({integration.serviceName})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {integrations.length === 0 && !loadingIntegrations && (
                    <p className="text-xs text-orange-600 mt-1">
                      No AI integrations found. You can add them in the Integrations page.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Model Configuration (Optional)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="ai-model" className="text-xs">Model</Label>
                      <Input
                        id="ai-model"
                        placeholder="e.g., gpt-4o-mini"
                        value={newColumn.settings?.aiTask?.modelConfig?.model || ''}
                        onChange={(e) => setNewColumn(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            aiTask: {
                              ...prev.settings?.aiTask,
                              modelConfig: {
                                ...prev.settings?.aiTask?.modelConfig,
                                model: e.target.value
                              }
                            }
                          }
                        }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ai-temperature" className="text-xs">Temperature</Label>
                      <Input
                        id="ai-temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        placeholder="0.7"
                        value={newColumn.settings?.aiTask?.modelConfig?.temperature || ''}
                        onChange={(e) => setNewColumn(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            aiTask: {
                              ...prev.settings?.aiTask,
                              modelConfig: {
                                ...prev.settings?.aiTask?.modelConfig,
                                temperature: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          }
                        }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {newColumn.type !== 'ai_task' && (
              <div>
                <Label htmlFor="default-value">Default Value</Label>
                <Input
                  id="default-value"
                  placeholder="Optional default value"
                  value={newColumn.defaultValue}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, defaultValue: e.target.value }))}
                />
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="required" 
                  checked={newColumn.isRequired}
                  onCheckedChange={(checked) => setNewColumn(prev => ({ ...prev, isRequired: !!checked }))}
                />
                <Label htmlFor="required">Required</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="editable" 
                  checked={newColumn.isEditable}
                  onCheckedChange={(checked) => setNewColumn(prev => ({ ...prev, isEditable: !!checked }))}
                />
                <Label htmlFor="editable">Editable</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddColumnDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddColumn}
              disabled={isLoading || !newColumn.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Column'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog */}
      <Dialog open={isEditColumnDialogOpen} onOpenChange={setIsEditColumnDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
            <DialogDescription>
              Update the column configuration.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-column-name">Column Name *</Label>
              <Input
                id="edit-column-name"
                placeholder="Enter column name"
                value={newColumn.name}
                onChange={(e) => setNewColumn(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-column-type">Column Type</Label>
              <Select value={newColumn.type} onValueChange={(value: any) => setNewColumn(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMN_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* AI Task Configuration */}
            {newColumn.type === 'ai_task' && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  <h4 className="font-medium">AI Task Configuration</h4>
                </div>

                <div>
                  <Label htmlFor="edit-ai-prompt">Prompt Template *</Label>
                  <Textarea
                    id="edit-ai-prompt"
                    placeholder="Enter your prompt template. Use {{column_name}} to reference other columns..."
                    value={newColumn.settings?.aiTask?.prompt || ''}
                    onChange={(e) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          prompt: e.target.value
                        }
                      }
                    }))}
                    rows={4}
                    className="resize-none"
                  />
                  {availableVariables.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground mb-1">Available variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {availableVariables.map((variable) => (
                          <button
                            key={variable}
                            type="button"
                            onClick={() => {
                              const currentPrompt = newColumn.settings?.aiTask?.prompt || '';
                              const newPrompt = currentPrompt + `{{${variable}}}`;
                              setNewColumn(prev => ({
                                ...prev,
                                settings: {
                                  ...prev.settings,
                                  aiTask: {
                                    ...prev.settings?.aiTask,
                                    prompt: newPrompt
                                  }
                                }
                              }));
                            }}
                            className="px-2 py-1 text-xs bg-primary/10 hover:bg-primary/20 rounded border"
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="edit-ai-use-case">Use Case</Label>
                  <Select 
                    value={newColumn.settings?.aiTask?.useCase || 'content_creation'}
                    onValueChange={(value) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          useCase: value
                        }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="content_creation">Content Creation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="edit-ai-integration">Default Integration (Optional)</Label>
                  <Select 
                    value={newColumn.settings?.aiTask?.integrationId || 'none'}
                    onValueChange={(value) => setNewColumn(prev => ({
                      ...prev,
                      settings: {
                        ...prev.settings,
                        aiTask: {
                          ...prev.settings?.aiTask,
                          integrationId: value === 'none' ? undefined : value
                        }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select integration (can be overridden later)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No default (select during execution)</SelectItem>
                      {loadingIntegrations ? (
                        <SelectItem value="loading" disabled>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Loading integrations...
                        </SelectItem>
                      ) : (
                        integrations.map((integration) => (
                          <SelectItem key={integration.id} value={integration.id}>
                            <div className="flex items-center gap-2">
                              <span>🤖</span>
                              <span>{integration.name}</span>
                              <span className="text-xs text-muted-foreground">({integration.serviceName})</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {integrations.length === 0 && !loadingIntegrations && (
                    <p className="text-xs text-orange-600 mt-1">
                      No AI integrations found. You can add them in the Integrations page.
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <Label>Model Configuration (Optional)</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-ai-model" className="text-xs">Model</Label>
                      <Input
                        id="edit-ai-model"
                        placeholder="e.g., gpt-4o-mini"
                        value={newColumn.settings?.aiTask?.modelConfig?.model || ''}
                        onChange={(e) => setNewColumn(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            aiTask: {
                              ...prev.settings?.aiTask,
                              modelConfig: {
                                ...prev.settings?.aiTask?.modelConfig,
                                model: e.target.value
                              }
                            }
                          }
                        }))}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-ai-temperature" className="text-xs">Temperature</Label>
                      <Input
                        id="edit-ai-temperature"
                        type="number"
                        min="0"
                        max="2"
                        step="0.1"
                        placeholder="0.7"
                        value={newColumn.settings?.aiTask?.modelConfig?.temperature || ''}
                        onChange={(e) => setNewColumn(prev => ({
                          ...prev,
                          settings: {
                            ...prev.settings,
                            aiTask: {
                              ...prev.settings?.aiTask,
                              modelConfig: {
                                ...prev.settings?.aiTask?.modelConfig,
                                temperature: e.target.value ? parseFloat(e.target.value) : undefined
                              }
                            }
                          }
                        }))}
                        className="h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {newColumn.type !== 'ai_task' && (
              <div>
                <Label htmlFor="edit-default-value">Default Value</Label>
                <Input
                  id="edit-default-value"
                  placeholder="Optional default value"
                  value={newColumn.defaultValue}
                  onChange={(e) => setNewColumn(prev => ({ ...prev, defaultValue: e.target.value }))}
                />
              </div>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-required" 
                  checked={newColumn.isRequired}
                  onCheckedChange={(checked) => setNewColumn(prev => ({ ...prev, isRequired: !!checked }))}
                />
                <Label htmlFor="edit-required">Required</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="edit-editable" 
                  checked={newColumn.isEditable}
                  onCheckedChange={(checked) => setNewColumn(prev => ({ ...prev, isEditable: !!checked }))}
                />
                <Label htmlFor="edit-editable">Editable</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditColumnDialogOpen(false);
                setEditingColumn(null);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditColumn}
              disabled={isLoading || !newColumn.name.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Column'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Task Execution Dialog */}
      <Dialog open={isExecuteAiTaskDialogOpen} onOpenChange={setIsExecuteAiTaskDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Execute AI Task</DialogTitle>
            <DialogDescription>
              Run the AI task for "{executingColumn?.name}" column
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Current Prompt Display */}
            {executingColumn?.settings?.aiTask?.prompt && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Prompt Template:</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {executingColumn.settings.aiTask.prompt}
                </p>
              </div>
            )}

            {/* Execution Scope */}
            <div>
              <Label>Execution Scope</Label>
              <Select value={executionScope} onValueChange={(value: any) => setExecutionScope(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="column">
                    <div className="flex items-center gap-2">
                      <span>🗂️</span>
                      <span>Entire Column ({table?.totalRows || 0} rows)</span>
                    </div>
                  </SelectItem>
                  {selectedRows.size > 0 && (
                    <SelectItem value="selected_rows">
                      <div className="flex items-center gap-2">
                        <span>✅</span>
                        <span>Selected Rows ({selectedRows.size} rows)</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="single_row">
                    <div className="flex items-center gap-2">
                      <span>📄</span>
                      <span>Single Row (first row only)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="single_cell">
                    <div className="flex items-center gap-2">
                      <span>🔗</span>
                      <span>Single Cell (first cell only)</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Integration Selection */}
            <div>
              <Label>AI Integration *</Label>
              <Select value={executionIntegrationId} onValueChange={setExecutionIntegrationId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an AI integration" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      <div className="flex items-center gap-2">
                        <span>🤖</span>
                        <span>{integration.name}</span>
                        <span className="text-xs text-muted-foreground">({integration.serviceName})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {integrations.length === 0 && (
                <p className="text-xs text-orange-600 mt-1">
                  No AI integrations found. Please add them in the Integrations page.
                </p>
              )}
            </div>

            {/* Execution Summary */}
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">Execution Summary:</h4>
              <ul className="text-xs text-blue-700 dark:text-blue-300 mt-1 space-y-1">
                <li>• Column: {executingColumn?.name}</li>
                <li>• Scope: {executionScope.replace('_', ' ')}</li>
                <li>• Integration: {integrations.find(i => i.id === executionIntegrationId)?.name || 'None selected'}</li>
                {executionScope === 'column' && <li>• Estimated tasks: {table?.totalRows || 0}</li>}
                {executionScope === 'selected_rows' && <li>• Estimated tasks: {selectedRows.size}</li>}
                {(executionScope === 'single_row' || executionScope === 'single_cell') && <li>• Estimated tasks: 1</li>}
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsExecuteAiTaskDialogOpen(false);
                setExecutingColumn(null);
              }}
              disabled={isExecuting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleExecuteAiTask}
              disabled={isExecuting || !executionIntegrationId || integrations.length === 0}
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <span className="mr-2">🚀</span>
                  Execute AI Task
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
} 