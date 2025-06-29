'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type UserTable, type CreateTableRequest } from '@/lib/api';
import { 
  Plus,
  Table as TableIcon,
  Search,
  MoreHorizontal,
  Calendar,
  Users,
  Database,
  Archive,
  Trash2,
  Edit3,
  Eye,
  ArrowLeft,
  Loader2,
  AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserProfileDropdown from '@/components/navigation/UserProfileDropdown';

const COLUMN_TYPES = [
  { value: 'text', label: 'Text', description: 'Free text input' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  { value: 'currency', label: 'Currency', description: 'Monetary values' },
  { value: 'date', label: 'Date', description: 'Date and time values' },
  { value: 'url', label: 'URL', description: 'Web links' },
  { value: 'email', label: 'Email', description: 'Email addresses' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false values' }
];

const TABLE_TEMPLATES = [
  {
    name: 'Apollo People Search',
    description: 'Table optimized for Apollo search results',
    sourceType: 'apollo',
    columns: [
      { name: 'Name', type: 'text' as const, isRequired: true },
      { name: 'Title', type: 'text' as const },
      { name: 'Company', type: 'text' as const },
      { name: 'Email', type: 'email' as const },
      { name: 'Phone', type: 'text' as const },
      { name: 'LinkedIn', type: 'url' as const },
      { name: 'Seniority', type: 'text' as const },
      { name: 'Departments', type: 'text' as const }
    ]
  },
  {
    name: 'Lead Management',
    description: 'Track and manage sales leads',
    sourceType: 'manual',
    columns: [
      { name: 'Lead Name', type: 'text' as const, isRequired: true },
      { name: 'Company', type: 'text' as const },
      { name: 'Email', type: 'email' as const },
      { name: 'Phone', type: 'text' as const },
      { name: 'Lead Score', type: 'number' as const },
      { name: 'Qualified', type: 'checkbox' as const },
      { name: 'Last Contact', type: 'date' as const },
      { name: 'Deal Value', type: 'currency' as const }
    ]
  },
  {
    name: 'Contact List',
    description: 'Simple contact management',
    sourceType: 'manual',
    columns: [
      { name: 'Name', type: 'text' as const, isRequired: true },
      { name: 'Email', type: 'email' as const },
      { name: 'Phone', type: 'text' as const },
      { name: 'Company', type: 'text' as const },
      { name: 'Website', type: 'url' as const },
      { name: 'Notes', type: 'text' as const }
    ]
  }
];

export default function TablesPage() {
  const [user, setUser] = useState<any>(null);
  const [tables, setTables] = useState<UserTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTableData, setCreateTableData] = useState<CreateTableRequest>({
    name: '',
    description: '',
    sourceType: 'manual',
    columns: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
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
  }, [router, showArchived]);

  const fetchTables = async () => {
    try {
      const response = await apiClient.tables.list(showArchived);
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching tables:', error);
      toast.error('Failed to load tables');
    }
  };

  const handleCreateTable = async () => {
    if (!createTableData.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    setIsCreating(true);
    try {
      const response = await apiClient.tables.create(createTableData);
      if (response.data.success) {
        toast.success('Table created successfully');
        setIsCreateDialogOpen(false);
        setCreateTableData({
          name: '',
          description: '',
          sourceType: 'manual',
          columns: []
        });
        setSelectedTemplate('');
        await fetchTables();
      }
    } catch (error: any) {
      console.error('Error creating table:', error);
      toast.error(error.response?.data?.error || 'Failed to create table');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteTable = async (tableId: string, tableName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${tableName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await apiClient.tables.delete(tableId);
      if (response.data.success) {
        toast.success('Table deleted successfully');
        await fetchTables();
      }
    } catch (error: any) {
      console.error('Error deleting table:', error);
      toast.error(error.response?.data?.error || 'Failed to delete table');
    }
  };

  const handleArchiveTable = async (tableId: string, isArchived: boolean) => {
    try {
      const response = await apiClient.tables.update(tableId, { isArchived: !isArchived });
      if (response.data.success) {
        toast.success(isArchived ? 'Table restored' : 'Table archived');
        await fetchTables();
      }
    } catch (error: any) {
      console.error('Error updating table:', error);
      toast.error('Failed to update table');
    }
  };

  const handleTemplateSelect = (templateName: string) => {
    const template = TABLE_TEMPLATES.find(t => t.name === templateName);
    if (template) {
      setCreateTableData({
        name: template.name,
        description: template.description,
        sourceType: template.sourceType,
        columns: template.columns
      });
    }
    setSelectedTemplate(templateName);
  };

  const addColumn = () => {
    setCreateTableData(prev => ({
      ...prev,
      columns: [
        ...(prev.columns || []),
        { name: '', type: 'text', isRequired: false, isEditable: true }
      ]
    }));
  };

  const updateColumn = (index: number, field: string, value: any) => {
    setCreateTableData(prev => ({
      ...prev,
      columns: prev.columns?.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      ) || []
    }));
  };

  const removeColumn = (index: number) => {
    setCreateTableData(prev => ({
      ...prev,
      columns: prev.columns?.filter((_, i) => i !== index) || []
    }));
  };

  const filteredTables = tables.filter(table => {
    // Search filter
    const matchesSearch = !searchQuery || 
      table.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (table.description && table.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Source type filter
    const matchesSourceType = sourceTypeFilter === 'all' || table.sourceType === sourceTypeFilter;
    
    return matchesSearch && matchesSourceType;
  });

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'apollo':
        return <Database className="h-4 w-4" />;
      case 'manual':
        return <Edit3 className="h-4 w-4" />;
      default:
        return <TableIcon className="h-4 w-4" />;
    }
  };

  const getSourceTypeLabel = (sourceType: string) => {
    switch (sourceType) {
      case 'apollo':
        return 'Apollo Import';
      case 'manual':
        return 'Manual Entry';
      default:
        return sourceType;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-xl font-bold">Tables</h1>
                <p className="text-sm text-muted-foreground">
                  Manage your data tables
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Table
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Table</DialogTitle>
                    <DialogDescription>
                      Set up a new table to store and manage your data.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <Tabs defaultValue="template" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="template">From Template</TabsTrigger>
                      <TabsTrigger value="custom">Custom Table</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="template" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {TABLE_TEMPLATES.map((template) => (
                          <Card 
                            key={template.name} 
                            className={`cursor-pointer transition-all ${
                              selectedTemplate === template.name ? 'ring-2 ring-primary' : 'hover:shadow-md'
                            }`}
                            onClick={() => handleTemplateSelect(template.name)}
                          >
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg flex items-center gap-2">
                                {getSourceTypeIcon(template.sourceType)}
                                {template.name}
                              </CardTitle>
                              <CardDescription className="text-sm">
                                {template.description}
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="text-sm text-muted-foreground">
                                {template.columns.length} columns included
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="custom" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="table-name">Table Name *</Label>
                          <Input
                            id="table-name"
                            placeholder="Enter table name"
                            value={createTableData.name}
                            onChange={(e) => setCreateTableData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="source-type">Source Type</Label>
                          <Select 
                            value={createTableData.sourceType}
                            onValueChange={(value) => setCreateTableData(prev => ({ ...prev, sourceType: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="manual">Manual Entry</SelectItem>
                              <SelectItem value="apollo">Apollo Import</SelectItem>
                              <SelectItem value="csv">CSV Import</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Optional description"
                          value={createTableData.description}
                          onChange={(e) => setCreateTableData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  {/* Columns Configuration */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Columns</Label>
                      <Button variant="outline" size="sm" onClick={addColumn}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Column
                      </Button>
                    </div>
                    
                    {createTableData.columns && createTableData.columns.length > 0 ? (
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {createTableData.columns.map((column, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                            <div className="flex-1">
                              <Input
                                placeholder="Column name"
                                value={column.name}
                                onChange={(e) => updateColumn(index, 'name', e.target.value)}
                              />
                            </div>
                            <div className="w-32">
                              <Select 
                                value={column.type}
                                onValueChange={(value) => updateColumn(index, 'type', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {COLUMN_TYPES.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                      {type.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No columns defined. Add columns to start building your table.
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleCreateTable}
                      disabled={isCreating || !createTableData.name.trim()}
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Table'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              
              <UserProfileDropdown />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">

      {/* Filters and Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="apollo">Apollo Import</SelectItem>
            <SelectItem value="manual">Manual Entry</SelectItem>
            <SelectItem value="csv">CSV Import</SelectItem>
          </SelectContent>
        </Select>
        
        <Tabs value={showArchived ? 'archived' : 'active'} onValueChange={(value) => setShowArchived(value === 'archived')}>
          <TabsList>
            <TabsTrigger value="active">Active Tables</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tables Grid */}
      {filteredTables.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              {tables.length === 0 ? (
                <>
                  <TableIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tables Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first table to start organizing your data.
                  </p>
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Table
                  </Button>
                </>
              ) : (
                <>
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Tables Found</h3>
                  <p className="text-muted-foreground">
                    No tables match your search criteria.
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((table) => (
            <Card key={table.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getSourceTypeIcon(table.sourceType)}
                    {table.name}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/dashboard/tables/${table.id}`)}>
                        <Eye className="h-4 w-4 mr-2" />
                        View Table
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleArchiveTable(table.id, table.isArchived)}>
                        <Archive className="h-4 w-4 mr-2" />
                        {table.isArchived ? 'Restore' : 'Archive'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteTable(table.id, table.name)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {table.description && (
                  <CardDescription className="text-sm">
                    {table.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Database className="h-3 w-3" />
                      {table._count?.columns || 0} columns
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {table._count?.rows || 0} rows
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {getSourceTypeLabel(table.sourceType)}
                    </Badge>
                    {table.isArchived && (
                      <Badge variant="outline" className="text-xs">
                        Archived
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    Created {new Date(table.createdAt).toLocaleDateString()}
                  </div>
                  
                  <Button 
                    className="w-full" 
                    onClick={() => router.push(`/dashboard/tables/${table.id}`)}
                  >
                    Open Table
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      </div>
    </div>
  );
} 