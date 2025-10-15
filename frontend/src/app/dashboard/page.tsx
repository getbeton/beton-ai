'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type CreateTableRequest } from '@/lib/api';
import { 
  Plus,
  Loader2,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

import { Button } from '@/components/ui/button';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardShell from '@/components/layout/DashboardShell';
import TablesPageAdapter, { type TablesPageAdapterMethods } from '@/components/dashboard/TablesPageAdapter';
import { EmptyState } from '@/components/EmptyState';
import { CsvUploadModal } from '@/components/upload/CsvUploadModal';
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone';
import { validateCSVFile, generateTableNameFromFile } from '@/lib/utils';

// Column types available for table creation
const COLUMN_TYPES = [
  { value: 'text', label: 'Text', description: 'Free text input' },
  { value: 'number', label: 'Number', description: 'Numeric values' },
  { value: 'currency', label: 'Currency', description: 'Monetary values' },
  { value: 'date', label: 'Date', description: 'Date and time values' },
  { value: 'url', label: 'URL', description: 'Web links' },
  { value: 'email', label: 'Email', description: 'Email addresses' },
  { value: 'checkbox', label: 'Checkbox', description: 'True/false values' },
  { value: 'ai_task', label: 'AI Task', description: 'AI-generated content' }
];

// Predefined table templates for quick setup
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

/**
 * Dashboard Page - Primary Entry Point
 * 
 * Main dashboard showing tables list with advanced filtering and management.
 * Consolidated from /dashboard/tables to /dashboard for simpler navigation.
 * 
 * Features:
 * - Advanced table view with filtering, sorting, pagination
 * - CSV upload with drag & drop
 * - Create table from templates or custom schema
 * - Apollo search integration
 * - Empty state for first-time users
 */
export default function DashboardPage() {
  const router = useRouter();
  
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Table creation dialog state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createTableData, setCreateTableData] = useState<CreateTableRequest>({
    name: '',
    description: '',
    sourceType: 'manual',
    columns: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);
  
  // CSV upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Empty state flag (no tables exist)
  const [hasNoTables, setHasNoTables] = useState(false);
  
  // Reference to adapter methods for external control
  const adapterMethodsRef = useRef<TablesPageAdapterMethods | null>(null);

  /**
   * Effect: Track component mount state to prevent modal auto-opening
   */
  useEffect(() => {
    setMounted(true);
    setShowUploadModal(false);
    return () => setMounted(false);
  }, []);

  /**
   * Effect: Check user authentication on mount
   */
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
        
        // Check if user has any tables
        const response = await apiClient.tables.list();
        if (response.data.success) {
          setHasNoTables(response.data.data.length === 0);
        }
      } catch (error) {
        console.error('[DashboardPage] Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  /**
   * Handler: Create new table
   * 
   * Creates table via API and refreshes the list
   */
  const handleCreateTable = async () => {
    if (!createTableData.name.trim()) {
      toast.error('Table name is required');
      return;
    }

    setIsCreating(true);
    try {
      console.info('[DashboardPage] Creating table:', createTableData.name);
      const response = await apiClient.tables.create(createTableData);
      
      if (response.data.success) {
        toast.success('Table created successfully');
        
        // Close dialog and reset form
        setIsCreateDialogOpen(false);
        setCreateTableData({
          name: '',
          description: '',
          sourceType: 'manual',
          columns: []
        });
        setSelectedTemplate('');
        
        // Add new table to adapter list
        if (adapterMethodsRef.current) {
          adapterMethodsRef.current.addNewTable(response.data.data);
        }
        
        // Update empty state
        setHasNoTables(false);
      }
    } catch (error: any) {
      console.error('[DashboardPage] Error creating table:', error);
      toast.error(error.response?.data?.error || 'Failed to create table');
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Handler: Select template for table creation
   */
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

  /**
   * Handler: Add column to table schema
   */
  const addColumn = () => {
    setCreateTableData(prev => ({
      ...prev,
      columns: [
        ...(prev.columns || []),
        { name: '', type: 'text', isRequired: false, isEditable: true }
      ]
    }));
  };

  /**
   * Handler: Update column in table schema
   */
  const updateColumn = (index: number, field: string, value: any) => {
    setCreateTableData(prev => ({
      ...prev,
      columns: prev.columns?.map((col, i) => 
        i === index ? { ...col, [field]: value } : col
      ) || []
    }));
  };

  /**
   * Handler: Remove column from table schema
   */
  const removeColumn = (index: number) => {
    setCreateTableData(prev => ({
      ...prev,
      columns: prev.columns?.filter((_, i) => i !== index) || []
    }));
  };

  /**
   * Handler: Trigger CSV import modal
   */
  const handleImportCSV = useCallback(() => {
    console.info('[DashboardPage] CSV import triggered, mounted:', mounted);
    if (mounted) {
      setShowUploadModal(true);
    }
  }, [mounted]);

  /**
   * Handler: Navigate to Apollo search
   * Updated to return to /dashboard instead of /dashboard/tables
   */
  const handleSearchApollo = useCallback(() => {
    console.info('[DashboardPage] Apollo search triggered');
    router.push('/dashboard/apollo-search?returnTo=/dashboard');
  }, [router]);

  /**
   * Handler: Webhook connection placeholder
   */
  const handleConnectWebhook = useCallback(() => {
    console.info('[DashboardPage] Webhook connection triggered');
    toast('Webhook integrations are coming soon.');
  }, []);

  /**
   * Handler: CSV file upload
   * 
   * Validates file, uploads to API, and updates table list
   */
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    console.info('[DashboardPage] CSV file upload started:', file.name);
    
    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    // Generate table name from filename
    const tableName = generateTableNameFromFile(file.name);

    try {
      toast.loading(`Uploading ${file.name}...`, { id: 'csv-upload' });
      
      // Upload CSV to API
      const response = await apiClient.tables.uploadCSV(file, tableName);
      
      if (response.data.success) {
        toast.success('CSV uploaded successfully! Processing...', { id: 'csv-upload' });
        
        // Close upload modal
        setShowUploadModal(false);
        
        // Update empty state
        setHasNoTables(false);
        
        // Refresh table list to show new table
        if (adapterMethodsRef.current) {
          // Wait a bit for backend processing, then refetch
          setTimeout(() => {
            adapterMethodsRef.current?.refetch();
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('[DashboardPage] CSV upload failed:', error);
      toast.error(error.response?.data?.error || 'Failed to upload CSV', { id: 'csv-upload' });
    }
  };

  /**
   * Callback: Store adapter methods reference
   */
  const handleAdapterReady = useCallback((methods: TablesPageAdapterMethods) => {
    console.info('[DashboardPage] Adapter methods ready');
    adapterMethodsRef.current = methods;
  }, []);

  // Render loading state during authentication check
  if (loading) {
    return (
      <DashboardShell title="Tables" description="Manage your data tables">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell 
      title="Tables" 
      description="Manage your data tables"
      actions={
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
                        <CardTitle className="text-lg">
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
                        Remove
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
      }
    >
      <Toaster position="top-right" />

      {/* CSV Upload Modal */}
      <CsvUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadFiles={handleFileUpload}
      />

      {/* Main Content with Drag & Drop Support */}
      <FileUploadDropzone onFileUpload={handleFileUpload}>
        {hasNoTables ? (
          // Show empty state for new users
          <EmptyState
            onImportCSV={handleImportCSV}
            onSearchApollo={handleSearchApollo}
            onConnectWebhook={handleConnectWebhook}
          />
        ) : (
          // Show advanced table view
          <TablesPageAdapter
            userEmail={user?.email}
            onImportCSV={handleImportCSV}
            onSearchApollo={handleSearchApollo}
            initialLoading={false}
            onAdapterReady={handleAdapterReady}
          />
        )}
      </FileUploadDropzone>
    </DashboardShell>
  );
}
