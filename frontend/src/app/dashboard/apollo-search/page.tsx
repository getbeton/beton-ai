'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type Integration } from '@/lib/api';
import { 
  Search, 
  Filter, 
  Download, 
  Users, 
  Building, 
  MapPin, 
  Briefcase, 
  Mail, 
  Phone, 
  Globe, 
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Edit3,
  ExternalLink,
  Database
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
import { Separator } from '@/components/ui/separator';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Apollo People Search types
interface PeopleSearchFilters {
  q?: string;
  person_titles?: string[];
  person_locations?: string[];
  person_seniorities?: string[];
  organization_names?: string[];
  organization_locations?: string[];
  organization_ids?: string[];
  organization_industries?: string[];
  organization_num_employees_ranges?: string[];
  organization_founded_year_ranges?: string[];
  technologies?: string[];
  person_email_status?: string[];
  person_phone_status?: string[];
  person_departments?: string[];
  contact_email_status?: string[];
  page?: number;
  per_page?: number;
}

interface PeopleSearchResult {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  phone?: string;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    linkedin_url?: string;
    locations?: Array<{
      name: string;
      country: string;
      region?: string;
    }>;
  };
  seniority?: string;
  departments?: string[];
  subdepartments?: string[];
  functions?: string[];
  email_status?: string;
  phone_status?: string;
}

interface SearchBreadcrumb {
  display_name: string;
  value: string;
  count: number;
}

interface SearchResponse {
  people: PeopleSearchResult[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
  breadcrumbs?: {
    signal_names: string[];
    person_titles: SearchBreadcrumb[];
    person_locations: SearchBreadcrumb[];
    person_seniorities: SearchBreadcrumb[];
    organization_locations: SearchBreadcrumb[];
    organization_industries: SearchBreadcrumb[];
    organization_num_employees_ranges: SearchBreadcrumb[];
    technologies: SearchBreadcrumb[];
    person_departments: SearchBreadcrumb[];
  };
}

// Editable Cell Component
interface EditableCellProps {
  value: string;
  onSave: (value: string) => void;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  className?: string;
}

function EditableCell({ value, onSave, isEditing, onEdit, onCancel, className = '' }: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    onCancel();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(value);
      onCancel();
    }
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyPress}
          className="h-8 text-sm"
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleSave}
        >
          <CheckCircle className="h-3 w-3 text-green-600" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={() => {
            setEditValue(value);
            onCancel();
          }}
        >
          <X className="h-3 w-3 text-red-600" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-1 cursor-pointer hover:bg-muted/50 p-1 rounded min-h-[32px] ${className}`}
      onClick={onEdit}
    >
      <span className="flex-1 text-sm">{value || 'Click to edit'}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
      >
        <Edit3 className="h-3 w-3" />
      </Button>
    </div>
  );
}

export default function ApolloSearchPage() {
  const [user, setUser] = useState<any>(null);
  const [apolloIntegrations, setApolloIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    person: true,
    company: false
  });
  const router = useRouter();

  // Search state
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<SearchResponse['breadcrumbs'] | null>(null);
  const [resultCount, setResultCount] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Table editing state
  const [editableData, setEditableData] = useState<Record<string, PeopleSearchResult>>({});
  const [editingCell, setEditingCell] = useState<string | null>(null);

  // Save to table state
  const [showSaveToTableModal, setShowSaveToTableModal] = useState(false);
  const [isSavingToTable, setIsSavingToTable] = useState(false);
  const [saveToTableData, setSaveToTableData] = useState({
    tableName: '',
    tableDescription: '',
    createNew: true,
    existingTableId: ''
  });

  // Filter state
  const [filters, setFilters] = useState<PeopleSearchFilters>({
    q: '',
    person_titles: [],
    person_locations: [],
    person_seniorities: [],
    organization_names: [],
    organization_locations: [],
    organization_industries: [],
    organization_num_employees_ranges: [],
    organization_founded_year_ranges: [],
    technologies: [],
    person_email_status: [],
    person_phone_status: [],
    person_departments: [],
    per_page: 25,
    page: 1
  });

  // Predefined filter options
  const predefinedOptions = {
    person_seniorities: [
      { value: 'owner', label: 'Owner' },
      { value: 'founder', label: 'Founder' },
      { value: 'c_suite', label: 'C-Suite' },
      { value: 'partner', label: 'Partner' },
      { value: 'vp', label: 'VP' },
      { value: 'head', label: 'Head' },
      { value: 'director', label: 'Director' },
      { value: 'manager', label: 'Manager' },
      { value: 'senior', label: 'Senior' },
      { value: 'entry', label: 'Entry Level' },
      { value: 'intern', label: 'Intern' }
    ],
    person_email_status: [
      'verified', 'guessed', 'unavailable', 'bounced'
    ],
    person_phone_status: [
      'verified', 'guessed', 'unavailable'
    ],
    organization_num_employees_ranges: [
      '1-10', '11-50', '51-200', '201-500', '501-1000', 
      '1001-5000', '5001-10000', '10001+'
    ],
    organization_founded_year_ranges: [
      '2020-2024', '2015-2019', '2010-2014', '2005-2009', 
      '2000-2004', '1990-1999', '1980-1989', 'Before 1980'
    ]
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
        await fetchApolloIntegrations();
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  const fetchApolloIntegrations = async () => {
    try {
      const response = await apiClient.integrations.list();
      if (response.data.success) {
        const apolloIntegrations = response.data.data.filter(
          (integration: Integration) => integration.serviceName === 'apollo' && integration.isActive
        );
        setApolloIntegrations(apolloIntegrations);
        
        // Auto-select first integration if available
        if (apolloIntegrations.length > 0) {
          setSelectedIntegration(apolloIntegrations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching Apollo integrations:', error);
      toast.error('Failed to load Apollo integrations');
    }
  };

  const handleSearch = async (resetPage = true) => {
    if (!selectedIntegration) {
      toast.error('Please select an Apollo integration first');
      return;
    }

    setSearching(true);
    try {
      const searchFilters = {
        ...filters,
        per_page: resultCount,
        page: resetPage ? 1 : currentPage
      };

      // Remove empty arrays and undefined values
      Object.keys(searchFilters).forEach(key => {
        const value = searchFilters[key as keyof PeopleSearchFilters];
        if (Array.isArray(value) && value.length === 0) {
          delete searchFilters[key as keyof PeopleSearchFilters];
        } else if (value === undefined || value === null || value === '') {
          delete searchFilters[key as keyof PeopleSearchFilters];
        }
      });

      console.log('Searching with filters:', searchFilters);

      // Make API call to backend using apiClient
      const response = await apiClient.integrations.apolloPeopleSearch(selectedIntegration, searchFilters);
      const data = response.data;

      if (data.success) {
        setSearchResults(data.data);
        setBreadcrumbs(data.data.breadcrumbs);
        if (resetPage) {
          setCurrentPage(1);
        }
        toast.success(`Found ${data.data.people.length} people`);
      } else {
        throw new Error('Search failed');
      }
    } catch (error: any) {
      console.error('Search error:', error);
      toast.error(error.message || 'Failed to search people');
    } finally {
      setSearching(false);
    }
  };

  const handleFilterChange = (filterKey: keyof PeopleSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const addFilterValue = (filterKey: keyof PeopleSearchFilters, value: string) => {
    if (!value.trim()) return;
    
    const currentValues = filters[filterKey] as string[] || [];
    if (!currentValues.includes(value.trim())) {
      handleFilterChange(filterKey, [...currentValues, value.trim()]);
    }
  };

  const removeFilterValue = (filterKey: keyof PeopleSearchFilters, value: string) => {
    const currentValues = filters[filterKey] as string[] || [];
    handleFilterChange(filterKey, currentValues.filter(v => v !== value));
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveToTable = async () => {
    if (!searchResults || searchResults.people.length === 0) {
      toast.error('No results to save');
      return;
    }

    if (saveToTableData.createNew && !saveToTableData.tableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    setIsSavingToTable(true);
    try {
      // Convert current editable data to table format (column names must match exactly)
      const tableData = searchResults.people.map(person => {
        const currentData = getCurrentPersonData(person.id);
        return {
          'Name': currentData.name || `${currentData.first_name} ${currentData.last_name}`.trim(),
          'First Name': currentData.first_name || '',
          'Last Name': currentData.last_name || '',
          'Title': currentData.title || '',
          'Email': currentData.email || '',
          'Phone': currentData.phone || '',
          'Company': currentData.organization?.name || '',
          'LinkedIn URL': currentData.linkedin_url || '',
          'Seniority': currentData.seniority || '',
          'Departments': currentData.departments?.join('; ') || '',
          'Email Status': currentData.email_status || '',
          'Phone Status': currentData.phone_status || '',
          'Company Website': currentData.organization?.website_url || ''
        };
      });

      if (saveToTableData.createNew) {
        // Create new table with Apollo search columns
        const defaultColumns = [
          { 
            name: 'Name', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Full name' }
          },
          { 
            name: 'First Name', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'First name' }
          },
          { 
            name: 'Last Name', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Last name' }
          },
          { 
            name: 'Title', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Job title' }
          },
          { 
            name: 'Email', 
            type: 'email' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'email@company.com' }
          },
          { 
            name: 'Phone', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Phone number' }
          },
          { 
            name: 'Company', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Company name' }
          },
          { 
            name: 'LinkedIn URL', 
            type: 'url' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'LinkedIn profile URL' }
          },
          { 
            name: 'Seniority', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { 
              placeholder: 'Seniority level',
              options: ['Entry', 'Senior', 'Manager', 'Director', 'VP', 'C-Suite', 'Founder']
            }
          },
          { 
            name: 'Departments', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Department(s)' }
          },
          { 
            name: 'Email Status', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: false,
            settings: { 
              readOnly: true,
              options: ['verified', 'guessed', 'unavailable', 'bounced']
            }
          },
          { 
            name: 'Phone Status', 
            type: 'text' as const, 
            isRequired: false, 
            isEditable: false,
            settings: { 
              readOnly: true,
              options: ['verified', 'guessed', 'unavailable']
            }
          },
          { 
            name: 'Company Website', 
            type: 'url' as const, 
            isRequired: false, 
            isEditable: true,
            settings: { placeholder: 'Company website URL' }
          }
        ];

        const response = await apiClient.tables.create({
          name: saveToTableData.tableName,
          description: saveToTableData.tableDescription || `Apollo search results imported on ${new Date().toLocaleDateString()}`,
          sourceType: 'apollo_search',
          columns: defaultColumns
        });

        if (response.data.success) {
          const tableId = response.data.data.id;
          
          // Import data to the new table using bulk add rows
          await apiClient.tables.bulkAddRows(tableId, tableData);

          toast.success(`Successfully saved ${tableData.length} people to table "${saveToTableData.tableName}"`);
          setShowSaveToTableModal(false);
          
          // Reset form
          setSaveToTableData({
            tableName: '',
            tableDescription: '',
            createNew: true,
            existingTableId: ''
          });
        }
      } else {
        // Add to existing table (future implementation)
        toast.error('Adding to existing table is not yet implemented');
      }
    } catch (error: any) {
      console.error('Error saving to table:', error);
      toast.error(error.message || 'Failed to save to table');
    } finally {
      setIsSavingToTable(false);
    }
  };

  const downloadResults = () => {
    if (!searchResults || searchResults.people.length === 0) {
      toast.error('No results to download');
      return;
    }

    // Convert editable results to CSV
    const headers = [
      'Name', 'First Name', 'Last Name', 'Title', 'Email', 'Phone', 'Company', 'LinkedIn', 
      'Seniority', 'Departments', 'Email Status', 'Phone Status', 'Company Website'
    ];

    const csvData = searchResults.people.map(person => {
      const currentData = getCurrentPersonData(person.id);
      return [
        currentData.name || `${currentData.first_name} ${currentData.last_name}`.trim(),
        currentData.first_name || '',
        currentData.last_name || '',
        currentData.title || '',
        currentData.email || '',
        currentData.phone || '',
        currentData.organization?.name || '',
        currentData.linkedin_url || '',
        currentData.seniority || '',
        currentData.departments?.join('; ') || '',
        currentData.email_status || '',
        currentData.phone_status || '',
        currentData.organization?.website_url || ''
      ];
    });

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `apollo-people-search-edited-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Edited results downloaded successfully!');
  };

  const getSeniorityLabel = (value: string) => {
    const seniority = predefinedOptions.person_seniorities.find(s => s.value === value);
    return seniority ? seniority.label : value;
  };

  // Initialize editable data when search results change
  useEffect(() => {
    if (searchResults?.people) {
      const editableDataMap: Record<string, PeopleSearchResult> = {};
      searchResults.people.forEach(person => {
        editableDataMap[person.id] = { ...person };
      });
      setEditableData(editableDataMap);
    }
  }, [searchResults]);

  // Handle cell editing
  const handleCellEdit = (personId: string, field: string, value: any) => {
    setEditableData(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [field]: value
      }
    }));
  };

  // Handle nested field editing (like organization.name)
  const handleNestedCellEdit = (personId: string, parentField: string, field: string, value: string) => {
    setEditableData(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        [parentField]: {
          ...prev[personId][parentField as keyof PeopleSearchResult] as any,
          [field]: value
        }
      }
    }));
  };

  // Get current data for a person (editable or original)
  const getCurrentPersonData = (personId: string): PeopleSearchResult => {
    return editableData[personId] || searchResults?.people.find(p => p.id === personId)!;
  };

  const clearAllFilters = () => {
    setFilters({
      q: '',
      person_titles: [],
      person_locations: [],
      person_seniorities: [],
      organization_names: [],
      organization_locations: [],
      organization_industries: [],
      organization_num_employees_ranges: [],
      organization_founded_year_ranges: [],
      technologies: [],
      person_email_status: [],
      person_phone_status: [],
      person_departments: [],
      per_page: 25,
      page: 1
    });
    setSearchResults(null);
    setBreadcrumbs(null);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (apolloIntegrations.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold">Apollo People Search</h1>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Apollo Integration Found</h3>
              <p className="text-muted-foreground mb-4">
                You need to add an Apollo integration first to use People Search.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Add Apollo Integration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Apollo People Search</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select Apollo Integration" />
            </SelectTrigger>
            <SelectContent>
              {apolloIntegrations.map((integration) => (
                <SelectItem key={integration.id} value={integration.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      integration.healthStatus === 'healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    {integration.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Filters Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Search Filters
              </CardTitle>
              <CardDescription>
                Refine your search with specific criteria
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Search */}
              <div>
                <Label htmlFor="search-query">Search Query</Label>
                <Input
                  id="search-query"
                  placeholder="e.g., software engineer, marketing manager"
                  value={filters.q || ''}
                  onChange={(e) => handleFilterChange('q', e.target.value)}
                />
              </div>

              {/* Result Count */}
              <div>
                <Label htmlFor="result-count">Results per page</Label>
                <Select value={resultCount.toString()} onValueChange={(value) => {
                  setResultCount(parseInt(value));
                  handleFilterChange('per_page', parseInt(value));
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 results</SelectItem>
                    <SelectItem value="25">25 results</SelectItem>
                    <SelectItem value="50">50 results</SelectItem>
                    <SelectItem value="100">100 results</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Person Filters */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2"
                  onClick={() => toggleSection('person')}
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">Person Filters</span>
                  </div>
                  {expandedSections.person ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedSections.person && (
                  <div className="space-y-4 pl-4">
                    {/* Job Titles */}
                    <div>
                      <Label>Job Titles</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="e.g., CEO, Manager, Developer"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addFilterValue('person_titles', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFilterValue('person_titles', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.person_titles?.map((title, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {title}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('person_titles', title)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Person Locations */}
                    <div>
                      <Label>Person Locations</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="e.g., New York, London, Remote"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addFilterValue('person_locations', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFilterValue('person_locations', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.person_locations?.map((location, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {location}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('person_locations', location)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Seniority Level */}
                    <div>
                      <Label>Seniority Level</Label>
                      <Select onValueChange={(value) => {
                        if (value && !filters.person_seniorities?.includes(value)) {
                          addFilterValue('person_seniorities', value);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select seniority" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedOptions.person_seniorities.map((seniority) => (
                            <SelectItem key={seniority.value} value={seniority.value}>
                              {seniority.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.person_seniorities?.map((seniority, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {getSeniorityLabel(seniority)}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('person_seniorities', seniority)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Email Status */}
                    <div>
                      <Label>Email Status</Label>
                      <Select onValueChange={(value) => {
                        if (value && !filters.person_email_status?.includes(value)) {
                          addFilterValue('person_email_status', value);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select email status" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedOptions.person_email_status.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.person_email_status?.map((status, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {status}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('person_email_status', status)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Company Filters */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  className="w-full justify-between p-2"
                  onClick={() => toggleSection('company')}
                >
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span className="font-medium">Company Filters</span>
                  </div>
                  {expandedSections.company ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                
                {expandedSections.company && (
                  <div className="space-y-4 pl-4">
                    {/* Company Names */}
                    <div>
                      <Label>Company Names</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="e.g., Google, Microsoft, Startup"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addFilterValue('organization_names', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFilterValue('organization_names', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.organization_names?.map((name, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {name}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('organization_names', name)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Company Size */}
                    <div>
                      <Label>Company Size (Employees)</Label>
                      <Select onValueChange={(value) => {
                        if (value && !filters.organization_num_employees_ranges?.includes(value)) {
                          addFilterValue('organization_num_employees_ranges', value);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedOptions.organization_num_employees_ranges.map((range) => (
                            <SelectItem key={range} value={range}>
                              {range} employees
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.organization_num_employees_ranges?.map((range, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {range} employees
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('organization_num_employees_ranges', range)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Industries */}
                    <div>
                      <Label>Industries</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          placeholder="e.g., Technology, Healthcare, Finance"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              addFilterValue('organization_industries', e.currentTarget.value);
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={(e) => {
                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                            addFilterValue('organization_industries', input.value);
                            input.value = '';
                          }}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {filters.organization_industries?.map((industry, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {industry}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0 ml-1"
                              onClick={() => removeFilterValue('organization_industries', industry)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={() => handleSearch(true)}
                  disabled={searching || !selectedIntegration}
                  className="w-full"
                >
                  {searching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Search People
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={clearAllFilters}
                  className="w-full"
                >
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Search Results
                  </CardTitle>
                  {searchResults && (
                    <CardDescription>
                      Found {searchResults.pagination.total_entries} people 
                      (showing {searchResults.people.length} on page {searchResults.pagination.page})
                    </CardDescription>
                  )}
                </div>
                {searchResults && searchResults.people.length > 0 && (
                  <div className="flex gap-2">
                    <Button onClick={() => setShowSaveToTableModal(true)} variant="default">
                      <Database className="h-4 w-4 mr-2" />
                      Save to Table
                    </Button>
                    <Button onClick={downloadResults} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download CSV
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!searchResults ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Search</h3>
                  <p className="text-muted-foreground">
                    Use the filters on the left to search for people using Apollo&apos;s powerful database.
                  </p>
                </div>
              ) : searchResults.people.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search filters to find more people.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Editable Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[200px]">Name</TableHead>
                          <TableHead className="w-[200px]">Title</TableHead>
                          <TableHead className="w-[200px]">Company</TableHead>
                          <TableHead className="w-[250px]">Email</TableHead>
                          <TableHead className="w-[150px]">Phone</TableHead>
                          <TableHead className="w-[120px]">Seniority</TableHead>
                          <TableHead className="w-[150px]">Departments</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {searchResults.people.map((person) => {
                          const currentData = getCurrentPersonData(person.id);
                          return (
                            <TableRow key={person.id}>
                              {/* Name Cell */}
                              <TableCell>
                                <EditableCell
                                  value={currentData.name || `${currentData.first_name} ${currentData.last_name}`.trim()}
                                  onSave={(value) => handleCellEdit(person.id, 'name', value)}
                                  isEditing={editingCell === `${person.id}-name`}
                                  onEdit={() => setEditingCell(`${person.id}-name`)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              </TableCell>

                              {/* Title Cell */}
                              <TableCell>
                                <EditableCell
                                  value={currentData.title || ''}
                                  onSave={(value) => handleCellEdit(person.id, 'title', value)}
                                  isEditing={editingCell === `${person.id}-title`}
                                  onEdit={() => setEditingCell(`${person.id}-title`)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              </TableCell>

                              {/* Company Cell */}
                              <TableCell>
                                <EditableCell
                                  value={currentData.organization?.name || ''}
                                  onSave={(value) => handleNestedCellEdit(person.id, 'organization', 'name', value)}
                                  isEditing={editingCell === `${person.id}-company`}
                                  onEdit={() => setEditingCell(`${person.id}-company`)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              </TableCell>

                              {/* Email Cell */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <EditableCell
                                    value={currentData.email || ''}
                                    onSave={(value) => handleCellEdit(person.id, 'email', value)}
                                    isEditing={editingCell === `${person.id}-email`}
                                    onEdit={() => setEditingCell(`${person.id}-email`)}
                                    onCancel={() => setEditingCell(null)}
                                    className="flex-1"
                                  />
                                  {currentData.email_status && (
                                    <span className={`w-2 h-2 rounded-full ${
                                      currentData.email_status === 'verified' ? 'bg-green-500' : 
                                      currentData.email_status === 'guessed' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} title={currentData.email_status} />
                                  )}
                                </div>
                              </TableCell>

                              {/* Phone Cell */}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <EditableCell
                                    value={currentData.phone || ''}
                                    onSave={(value) => handleCellEdit(person.id, 'phone', value)}
                                    isEditing={editingCell === `${person.id}-phone`}
                                    onEdit={() => setEditingCell(`${person.id}-phone`)}
                                    onCancel={() => setEditingCell(null)}
                                    className="flex-1"
                                  />
                                  {currentData.phone_status && (
                                    <span className={`w-2 h-2 rounded-full ${
                                      currentData.phone_status === 'verified' ? 'bg-green-500' : 
                                      currentData.phone_status === 'guessed' ? 'bg-yellow-500' : 'bg-red-500'
                                    }`} title={currentData.phone_status} />
                                  )}
                                </div>
                              </TableCell>

                              {/* Seniority Cell */}
                              <TableCell>
                                <EditableCell
                                  value={currentData.seniority || ''}
                                  onSave={(value) => handleCellEdit(person.id, 'seniority', value)}
                                  isEditing={editingCell === `${person.id}-seniority`}
                                  onEdit={() => setEditingCell(`${person.id}-seniority`)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              </TableCell>

                              {/* Departments Cell */}
                              <TableCell>
                                <EditableCell
                                  value={currentData.departments?.join(', ') || ''}
                                  onSave={(value) => {
                                    const departmentsArray = value.split(',').map(d => d.trim()).filter(d => d);
                                    handleCellEdit(person.id, 'departments', departmentsArray);
                                  }}
                                  isEditing={editingCell === `${person.id}-departments`}
                                  onEdit={() => setEditingCell(`${person.id}-departments`)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              </TableCell>

                              {/* Actions Cell */}
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  {currentData.linkedin_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                      className="h-8 w-8 p-0"
                                    >
                                      <a href={currentData.linkedin_url} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                  {currentData.organization?.website_url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      asChild
                                      className="h-8 w-8 p-0"
                                    >
                                      <a href={currentData.organization.website_url} target="_blank" rel="noopener noreferrer">
                                        <Globe className="h-3 w-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Pagination */}
                  {searchResults.pagination.total_pages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        onClick={() => {
                          setCurrentPage(prev => prev - 1);
                          handleFilterChange('page', currentPage - 1);
                          handleSearch(false);
                        }}
                      >
                        Previous
                      </Button>
                      
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {searchResults.pagination.total_pages}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= searchResults.pagination.total_pages}
                        onClick={() => {
                          setCurrentPage(prev => prev + 1);
                          handleFilterChange('page', currentPage + 1);
                          handleSearch(false);
                        }}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save to Table Modal */}
      <Dialog open={showSaveToTableModal} onOpenChange={setShowSaveToTableModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Results to Table</DialogTitle>
            <DialogDescription>
              Save your Apollo search results to a table for further management and organization.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="table-name">Table Name</Label>
              <Input
                id="table-name"
                placeholder="e.g., Lead Generation Q4 2024"
                value={saveToTableData.tableName}
                onChange={(e) => setSaveToTableData(prev => ({ ...prev, tableName: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="table-description">Description (Optional)</Label>
              <Textarea
                id="table-description"
                placeholder="Brief description of this table and its purpose..."
                value={saveToTableData.tableDescription}
                onChange={(e) => setSaveToTableData(prev => ({ ...prev, tableDescription: e.target.value }))}
                rows={3}
              />
            </div>

            {searchResults && (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>This will save {searchResults.people.length} people to your table with all the current edits you've made.</p>
                <p className="font-medium">Columns that will be created:</p>
                <div className="text-xs grid grid-cols-2 gap-1 pl-2">
                  <span>• Name</span>
                  <span>• Title</span>
                  <span>• Email</span>
                  <span>• Phone</span>
                  <span>• Company</span>
                  <span>• LinkedIn URL</span>
                  <span>• Seniority</span>
                  <span>• Departments</span>
                  <span>• Email Status</span>
                  <span>• Phone Status</span>
                  <span>• Company Website</span>
                  <span>• First/Last Name</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSaveToTableModal(false)}
              disabled={isSavingToTable}
            >
              Cancel
            </Button>
            <Button
              onClick={saveToTable}
              disabled={isSavingToTable || !saveToTableData.tableName.trim()}
            >
              {isSavingToTable ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Save to Table
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 