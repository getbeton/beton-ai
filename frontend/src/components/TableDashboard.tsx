'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable } from '@/lib/api';
import { 
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Edit3,
  Download,
  Copy,
  Trash2,
  Upload,
  Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { EmptyState } from './EmptyState';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
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
  status: "processing" | "ready" | "error";
  description?: string;
}

// Utility functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      return `${count}${interval.label.charAt(0)} ago`;
    }
  }
  
  return 'Just now';
};

// TableRowComponent with responsive design and actions
const TableRowComponent = ({ table, onAction }: { 
  table: TableData; 
  onAction: (action: string, tableId: string) => void;
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'CSV':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">CSV</Badge>;
      case 'Apollo':
        return <Badge variant="default" className="bg-green-100 text-green-800">Apollo</Badge>;
      case 'Manual':
        return <Badge variant="secondary">Manual</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  return (
    <TableRow className="hover:bg-muted/50">
      {/* Name and Status - Always visible */}
      <TableCell className="font-medium">
        <div className="flex items-center space-x-2">
          {getStatusIcon(table.status)}
          <div>
            <div className="font-medium">{table.name}</div>
            {table.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {table.description}
              </div>
            )}
          </div>
        </div>
      </TableCell>
      
      {/* Rows - Hidden on mobile */}
      <TableCell className="hidden md:table-cell text-right">
        {formatNumber(table.rows)}
      </TableCell>
      
      {/* Columns - Hidden on mobile and tablet */}
      <TableCell className="hidden lg:table-cell text-right">
        {table.columns}
      </TableCell>
      
      {/* Source - Hidden on mobile and tablet */}
      <TableCell className="hidden lg:table-cell">
        {getSourceBadge(table.source)}
      </TableCell>
      
      {/* Last Modified - Hidden on mobile */}
      <TableCell className="hidden md:table-cell text-muted-foreground">
        {formatTimeAgo(table.lastModified)}
      </TableCell>
      
      {/* Actions - Always visible */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAction('view', table.id)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('edit', table.id)}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('export', table.id)}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction('duplicate', table.id)}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onAction('delete', table.id)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
};

export default function TableDashboard() {
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const router = useRouter();

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

  const handleTableAction = async (action: string, tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    switch (action) {
      case 'view':
        router.push(`/dashboard/tables/${tableId}`);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        toast.success(`Edit ${table.name} - Coming soon!`);
        break;
      case 'export':
        // TODO: Implement export functionality
        toast.success(`Export ${table.name} - Coming soon!`);
        break;
      case 'duplicate':
        // TODO: Implement duplicate functionality
        toast.success(`Duplicate ${table.name} - Coming soon!`);
        break;
      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${table.name}"? This action cannot be undone.`)) {
          try {
            await apiClient.tables.delete(tableId);
            toast.success('Table deleted successfully');
            await fetchTables();
          } catch (error) {
            console.error('Error deleting table:', error);
            toast.error('Failed to delete table');
          }
        }
        break;
    }
  };

  // Handle file upload from EmptyState component
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Basic validation
    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      toast.error('File size must be less than 50MB');
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }
    
    // TODO: Implement actual file upload to backend
    // For now, just show success message
    toast.success(`Ready to upload ${file.name} - Upload functionality coming in PRD 2.2!`);
    
    console.log('File ready for upload:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified)
    });
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
    </div>
  );
}
