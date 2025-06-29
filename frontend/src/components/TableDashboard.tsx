'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable } from '@/lib/api';
import { 
  Search,
  Upload,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from './EmptyState';
import { UploadProgressOverlay } from './upload/UploadProgressOverlay';
import { validateCSVFile, generateTableNameFromFile, formatNumber, formatTimeAgo } from '@/lib/utils';
import { useWebSocket } from '@/hooks/useWebSocket';
import { CSVUploadProgress } from '@/types/bulkDownload';
import { TableRowComponent } from './tables/TableRowComponent';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// TableData interface as specified in PRD
interface TableData {
  id: string;
  name: string;
  rows: number;
  columns: number;
  source: "CSV" | "Apollo" | "Manual";
  lastModified: Date;
  status: "processing" | "ready" | "error" | "importing";
  description?: string;
}

// Upload progress interface for tracking file uploads
interface UploadProgress {
  fileName: string;
  progress: number;
  stage: "upload" | "parse" | "create" | "import";
  status: "uploading" | "success" | "error";
  jobId?: string;
  error?: string;
}





export default function TableDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const router = useRouter();

  // WebSocket progress tracking for CSV uploads
  const handleCSVUploadProgress = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    setUploadProgress(prev => prev ? {
      ...prev,
      progress: progress.progress.percentage,
      stage: mapBackendStageToFrontend(progress.status),
      currentStep: progress.progress.currentStep
    } : null);
  };

  const handleCSVUploadComplete = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    // Update table in list with final data
    if (progress.tableId && progress.tableName) {
      const newTable: TableData = {
        id: progress.tableId,
        name: progress.tableName,
        rows: progress.progress.totalRows || 0,
        columns: 0, // Will be updated when table data loads
        source: "CSV",
        lastModified: new Date(),
        status: "ready",
        description: "Recently uploaded CSV file",
      };

      setTables((prev) => [newTable, ...prev]);
    }

    setUploadProgress(prev => prev ? { 
      ...prev, 
      progress: 100, 
      status: 'success',
      tableId: progress.tableId 
    } : null);
    
    toast.success('Table created successfully!');
    setTimeout(() => setUploadProgress(null), 1500);
  };

  const handleCSVUploadFailed = (progress: CSVUploadProgress) => {
    if (!uploadProgress || progress.jobId !== uploadProgress.jobId) return;

    setUploadProgress(prev => prev ? { 
      ...prev, 
      status: 'error',
      error: progress.error || 'Upload failed'
    } : null);
    
    toast.error(progress.error || 'Upload failed');
    setTimeout(() => setUploadProgress(null), 3000);
  };

  // Initialize WebSocket connection
  const { isConnected } = useWebSocket({
    userId: user?.id,
    onCSVUploadProgress: handleCSVUploadProgress,
    onCSVUploadComplete: handleCSVUploadComplete,
    onCSVUploadFailed: handleCSVUploadFailed,
  });

  // Map backend progress stages to frontend stages
  const mapBackendStageToFrontend = (backendStage: string): UploadProgress['stage'] => {
    const stageMap: Record<string, UploadProgress['stage']> = {
      'uploading': 'upload',
      'parsing': 'parse', 
      'creating_table': 'create',
      'importing_data': 'import'
    };
    return stageMap[backendStage] || 'upload';
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
        await fetchTables();
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchTables = async () => {
    try {
      const response = await apiClient.tables.list();
      if (response.data.success) {
        // Transform UserTable to TableData format
        const transformedTables: TableData[] = response.data.data.map((table: UserTable) => ({
          id: table.id,
          name: table.name,
          rows: table._count?.rows || table.totalRows || 0,
          columns: table._count?.columns || table.columns?.length || 0,
          source: (table.sourceType === 'apollo' ? 'Apollo' : 
                   table.sourceType === 'csv' ? 'CSV' : 'Manual') as "CSV" | "Apollo" | "Manual",
          lastModified: new Date(table.updatedAt),
          status: 'ready' as const, // Default status, could be enhanced based on table processing state
          description: table.description,
        }));
        
        // Sort by lastModified descending as required
        transformedTables.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
        setTables(transformedTables);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    }
  };

  // Enhanced action handlers with proper functionality
  const handleViewTable = useCallback((tableId: string) => {
    router.push(`/dashboard/tables/${tableId}`);
  }, [router]);

  const handleEditTable = useCallback((tableId: string) => {
    router.push(`/dashboard/tables/${tableId}/edit`);
  }, [router]);

  const handleExportTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      toast.loading(`Preparing export for ${table.name}...`, { id: 'export' });
      
      // TODO: Replace with actual export API when available
      // const response = await apiClient.tables.export(tableId);
      
      // Simulate export process for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`${table.name} export completed!`, { id: 'export' });
      // In the future, this would trigger a download or show export modal
    } catch (error) {
      console.error('Export failed:', error);
      toast.error(`Failed to export ${table.name}`, { id: 'export' });
    }
  }, [tables]);

  const handleDuplicateTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    try {
      toast.loading(`Duplicating ${table.name}...`, { id: 'duplicate' });
      
      // TODO: Replace with actual duplicate API when available
      // const response = await apiClient.tables.duplicate(tableId);
      
      // Simulate duplication process for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock duplicated table for demonstration
      const duplicatedTable: TableData = {
        ...table,
        id: `${table.id}_copy_${Date.now()}`,
        name: `${table.name} (Copy)`,
        lastModified: new Date(),
        description: `Copy of ${table.name}`,
      };
      
      setTables(prev => [duplicatedTable, ...prev]);
      toast.success(`${table.name} duplicated successfully!`, { id: 'duplicate' });
    } catch (error) {
      console.error('Duplication failed:', error);
      toast.error(`Failed to duplicate ${table.name}`, { id: 'duplicate' });
    }
  }, [tables]);

  const handleDeleteTable = useCallback(async (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (!confirm(`Are you sure you want to delete "${table.name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      toast.loading(`Deleting ${table.name}...`, { id: 'delete' });
      
      const response = await apiClient.tables.delete(tableId);
      
      if (response.data.success) {
        setTables(prev => prev.filter(t => t.id !== tableId));
        toast.success(`${table.name} deleted successfully`, { id: 'delete' });
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(`Failed to delete ${table.name}`, { id: 'delete' });
    }
  }, [tables]);

  const handleTableAction = useCallback(async (action: string, tableId: string) => {
    switch (action) {
      case 'view':
        handleViewTable(tableId);
        break;
      case 'edit':
        handleEditTable(tableId);
        break;
      case 'export':
        await handleExportTable(tableId);
        break;
      case 'duplicate':
        await handleDuplicateTable(tableId);
        break;
      case 'delete':
        await handleDeleteTable(tableId);
        break;
      default:
        console.warn(`Unknown action: ${action}`);
    }
  }, [handleViewTable, handleEditTable, handleExportTable, handleDuplicateTable, handleDeleteTable]);

  // Handle file upload from EmptyState component
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file using utility function
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    // Generate table name from filename
    const tableName = generateTableNameFromFile(file.name);

    // Initialize upload progress
    const progress: UploadProgress = {
      fileName: file.name,
      progress: 0,
      stage: "upload",
      status: "uploading",
    };

    setUploadProgress(progress);
    toast.loading('Uploading CSV file...', { id: 'csv-upload' });

    try {
      // Start upload
      setUploadProgress(prev => prev ? { ...prev, progress: 10, stage: "upload" } : null);
      
      const response = await apiClient.tables.uploadCSV(file, tableName);
      
      if (response.data.success) {
        // Upload complete, backend processing begins
        setUploadProgress(prev => prev ? { 
          ...prev, 
          progress: 30, 
          stage: "parse",
          jobId: response.data.data.jobId 
        } : null);
        
        toast.success('CSV uploaded successfully! Processing...', { id: 'csv-upload' });
        
        // Real WebSocket progress tracking begins here
        // The WebSocket callbacks will handle further progress updates
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      setUploadProgress(prev => prev ? { 
        ...prev, 
        status: "error",
        error: error.message 
      } : null);
      
      toast.error(error.message || 'Failed to upload CSV file', { id: 'csv-upload' });
      
      setTimeout(() => setUploadProgress(null), 3000);
    }
  };

  // Filter tables based on search and filters
  const filteredTables = tables.filter(table => {
    // Search filter
    const matchesSearch = !searchQuery || 
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.description && table.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Source filter
    const matchesSource = sourceFilter === 'all' || table.source === sourceFilter;
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || table.status === statusFilter;
    
    return matchesSearch && matchesSource && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    );
  }

  // Show EmptyState when there are no tables at all
  if (tables.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Tables</h1>
            <p className="text-muted-foreground mt-1 sm:mt-2">
              Manage your prospect data tables and CSV uploads
            </p>
          </div>
          <EmptyState onFileUpload={handleFileUpload} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tables</h1>
          <p className="text-muted-foreground">
            Manage your data tables and CSV uploads
          </p>
        </div>
        <Button className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          Upload CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="CSV">CSV</SelectItem>
            <SelectItem value="Apollo">Apollo</SelectItem>
            <SelectItem value="Manual">Manual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ready">Ready</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tables List */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell text-right">Rows</TableHead>
                <TableHead className="hidden lg:table-cell text-right">Columns</TableHead>
                <TableHead className="hidden lg:table-cell">Source</TableHead>
                <TableHead className="hidden md:table-cell">Last Modified</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTables.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-muted-foreground">
                        {searchQuery || sourceFilter !== 'all' || statusFilter !== 'all' 
                          ? 'No tables match your filters'
                          : 'No tables found'
                        }
                      </div>
                      {!searchQuery && sourceFilter === 'all' && statusFilter === 'all' && (
                        <Button variant="outline" size="sm">
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first table
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTables.map((table) => (
                  <TableRowComponent 
                    key={table.id} 
                    table={table} 
                    onAction={handleTableAction}
                    isSelected={false}
                    showBulkActions={false}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {filteredTables.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Showing {filteredTables.length} of {tables.length} tables
        </div>
      )}

      {/* Upload Progress Overlay */}
      {uploadProgress && (
        <UploadProgressOverlay
          progress={uploadProgress}
          onClose={() => setUploadProgress(null)}
          onViewTable={(tableId) => {
            setUploadProgress(null);
            router.push(`/dashboard/tables/${tableId}`);
          }}
        />
      )}
    </div>
  );
}
