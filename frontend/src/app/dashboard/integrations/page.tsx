'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type Integration, PlatformApiKey } from '@/lib/api';
import { 
  Plus, 
  Key, 
  Trash2, 
  Copy, 
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Shield,
  MoreVertical,
  ExternalLink,
  Users,
  Search,
  Settings
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { formatDate, copyToClipboard } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import MainNavigation from '@/components/navigation/MainNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';

export default function IntegrationsPage() {
  const [user, setUser] = useState<any>(null);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthCheckLoading, setHealthCheckLoading] = useState<string | null>(null);
  const [platformKeys, setPlatformKeys] = useState<PlatformApiKey[]>([]);
  const [isValidatingKey, setIsValidatingKey] = useState(false);
  const [keyValidationResult, setKeyValidationResult] = useState<any>(null);
  const router = useRouter();

  const [newIntegration, setNewIntegration] = useState({
    serviceName: 'apollo',
    keySource: 'personal' as 'personal' | 'platform',
    platformKeyId: '',
    apiKey: '',
    keyType: 'personal' as 'platform' | 'personal'
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
        await fetchIntegrations();
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  // Fetch platform keys when service changes
  useEffect(() => {
    if (newIntegration.serviceName && newIntegration.keySource === 'platform') {
      fetchPlatformKeys(newIntegration.serviceName);
    }
  }, [newIntegration.serviceName, newIntegration.keySource]);

  const fetchIntegrations = async () => {
    try {
      const response = await apiClient.integrations.list();
      if (response.data.success) {
        setIntegrations(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
      toast.error('Failed to load integrations');
    }
  };

  const fetchPlatformKeys = async (serviceName: string) => {
    try {
      const response = await apiClient.integrations.getPlatformKeys(serviceName);
      if (response.data.success) {
        setPlatformKeys(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching platform keys:', error);
      setPlatformKeys([]);
    }
  };

  const handleValidateKey = async () => {
    if (!newIntegration.apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    setIsValidatingKey(true);
    try {
      const response = await apiClient.integrations.validateKey({
        serviceName: newIntegration.serviceName,
        apiKey: newIntegration.apiKey
      });
      
      setKeyValidationResult(response.data);
      
      if (response.data.success) {
        toast.success('API key is valid!');
      } else {
        toast.error(`Validation failed: ${response.data.message}`);
      }
    } catch (error: any) {
      console.error('Error validating API key:', error);
      toast.error(error.response?.data?.error || 'Failed to validate API key');
      setKeyValidationResult(null);
    } finally {
      setIsValidatingKey(false);
    }
  };

  const handleAddIntegration = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newIntegration.keySource === 'personal' && !newIntegration.apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    if (newIntegration.keySource === 'platform' && !newIntegration.platformKeyId) {
      toast.error('Please select a platform API key');
      return;
    }

    setIsSubmitting(true);
    try {
      // First validate the key if it's a personal key
      if (newIntegration.keySource === 'personal') {
        const validationResponse = await apiClient.integrations.validateKey({
          serviceName: newIntegration.serviceName,
          apiKey: newIntegration.apiKey
        });
        
        if (!validationResponse.data.success) {
          toast.error(`API key validation failed: ${validationResponse.data.message}`);
          setIsSubmitting(false);
          return;
        }
      }

      const integrationData = {
        serviceName: newIntegration.serviceName,
        name: newIntegration.serviceName, // Use service name as the integration name
        keySource: newIntegration.keySource,
        ...(newIntegration.keySource === 'platform' 
          ? { platformKeyId: newIntegration.platformKeyId }
          : { 
              apiKeys: [{
                apiKey: newIntegration.apiKey,
                keyType: newIntegration.keyType
              }]
            }
        )
      };

      const response = await apiClient.integrations.create(integrationData);
      if (response.data.success) {
        toast.success('Integration added successfully!');
        setShowAddModal(false);
        setNewIntegration({ 
          serviceName: 'apollo', 
          keySource: 'personal',
          platformKeyId: '',
          apiKey: '', 
          keyType: 'personal' 
        });
        await fetchIntegrations(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error adding integration:', error);
      toast.error(error.response?.data?.error || 'Failed to add integration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteIntegration = async (id: string) => {
    try {
      const response = await apiClient.integrations.delete(id);
      if (response.data.success) {
        toast.success('Integration deleted successfully');
        await fetchIntegrations(); // Refresh the list
      }
    } catch (error: any) {
      console.error('Error deleting integration:', error);
      toast.error(error.response?.data?.error || 'Failed to delete integration');
    }
  };

  const handleHealthCheck = async (id: string) => {
    setHealthCheckLoading(id);
    try {
      const response = await apiClient.integrations.healthCheck(id);
      if (response.data.success) {
        const status = response.data.data.status;
        const message = status === 'healthy' ? 'Integration is healthy' : 'Integration is unhealthy';
        toast.success(`Health check completed: ${message}`);
        await fetchIntegrations(); // Refresh to show updated status
      }
    } catch (error: any) {
      console.error('Error performing health check:', error);
      toast.error(error.response?.data?.error || 'Health check failed');
    } finally {
      setHealthCheckLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Healthy</Badge>;
      case 'unhealthy':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Unhealthy</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Unknown</Badge>;
    }
  };

  const getKeySourceBadge = (keySource: string, platformKey?: any) => {
    if (keySource === 'platform') {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Shield className="h-3 w-3 mr-1" />
          Platform Key
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
        <Key className="h-3 w-3 mr-1" />
        Personal Key
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <MainNavigation />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <BreadcrumbNavigation customSegments={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Integrations', href: '/dashboard/integrations' }
          ]} />
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{integrations.length}</div>
              <p className="text-xs text-muted-foreground">
                {integrations.filter(i => i.isActive).length} active
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Healthy Services</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {integrations.filter(i => i.healthStatus === 'healthy').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {integrations.filter(i => i.healthStatus === 'unhealthy').length} need attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Platform Keys</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {integrations.filter(i => i.keySource === 'platform').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {integrations.filter(i => i.keySource === 'personal').length} personal keys
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Integrations Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>API Integrations</CardTitle>
                <CardDescription>
                  Manage your API integrations and monitor their health status
                </CardDescription>
              </div>
              
              <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Integration
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add New Integration</DialogTitle>
                    <DialogDescription>
                      Connect a new service to your Beton-AI workflow.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddIntegration}>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="service">Service</Label>
                        <Select
                          value={newIntegration.serviceName}
                          onValueChange={(value) => setNewIntegration({ ...newIntegration, serviceName: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apollo">Apollo</SelectItem>
                            <SelectItem value="openai">OpenAI</SelectItem>
                            <SelectItem value="leadmagic">LeadMagic</SelectItem>
                            <SelectItem value="github">GitHub</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>API Key Source</Label>
                        <Tabs 
                          value={newIntegration.keySource} 
                          onValueChange={(value) => setNewIntegration({ 
                            ...newIntegration, 
                            keySource: value as 'personal' | 'platform',
                            platformKeyId: '',
                            apiKey: ''
                          })}
                        >
                          <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="personal">Personal Key</TabsTrigger>
                            <TabsTrigger value="platform">Platform Key</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="personal" className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="apiKey">Your API Key</Label>
                              <div className="relative">
                                <Textarea
                                  id="apiKey"
                                  placeholder="Enter your API key..."
                                  value={newIntegration.apiKey}
                                  onChange={(e) => {
                                    setNewIntegration({ ...newIntegration, apiKey: e.target.value });
                                    setKeyValidationResult(null); // Clear previous validation result
                                  }}
                                  rows={3}
                                  className={keyValidationResult ? 
                                    (keyValidationResult.success ? 'border-green-500' : 'border-red-500') : 
                                    ''
                                  }
                                />
                                {keyValidationResult && (
                                  <div className="absolute top-2 right-2">
                                    {keyValidationResult.success ? (
                                      <div className="flex items-center text-green-600">
                                        <CheckCircle className="h-4 w-4" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center text-red-600">
                                        <XCircle className="h-4 w-4" />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {/* Validation Button and Results */}
                              {(newIntegration.serviceName === 'apollo' || newIntegration.serviceName === 'openai' || newIntegration.serviceName === 'leadmagic') && newIntegration.apiKey.trim() && (
                                <div className="space-y-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleValidateKey}
                                    disabled={isValidatingKey}
                                    className="w-full"
                                  >
                                    {isValidatingKey ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                                        Validating...
                                      </>
                                    ) : (
                                      <>
                                        <Shield className="h-3 w-3 mr-2" />
                                        Validate API Key
                                      </>
                                    )}
                                  </Button>
                                  
                                  {keyValidationResult && (
                                    <Alert className={keyValidationResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                                      <AlertDescription className={keyValidationResult.success ? 'text-green-800' : 'text-red-800'}>
                                        {keyValidationResult.success ? (
                                          <div className="flex items-center">
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {keyValidationResult.message}
                                          </div>
                                        ) : (
                                          <div className="flex items-center">
                                            <XCircle className="h-4 w-4 mr-2" />
                                            {keyValidationResult.message}
                                          </div>
                                        )}
                                      </AlertDescription>
                                    </Alert>
                                  )}
                                </div>
                              )}
                              
                              <p className="text-xs text-muted-foreground">
                                Your API key will be securely encrypted and stored.
                                {(newIntegration.serviceName === 'apollo' || newIntegration.serviceName === 'openai' || newIntegration.serviceName === 'leadmagic') && (
                                  <> We recommend validating your key before adding it.</>
                                )}
                              </p>
                            </div>
                          </TabsContent>
                          
                          <TabsContent value="platform" className="space-y-4">
                            {platformKeys.length > 0 ? (
                              <div className="space-y-2">
                                <Label>Available Platform Keys</Label>
                                <Select
                                  value={newIntegration.platformKeyId}
                                  onValueChange={(value) => setNewIntegration({ ...newIntegration, platformKeyId: value })}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a platform key" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {platformKeys.map((key) => (
                                      <SelectItem key={key.id} value={key.id}>
                                        <div className="flex items-center justify-between w-full">
                                          <span>{key.serviceName.toUpperCase()} Key</span>
                                          <div className="flex items-center space-x-2 ml-2">
                                            {key.rateLimit && (
                                              <Badge variant="outline" className="text-xs">
                                                {key.rateLimit}/day
                                              </Badge>
                                            )}
                                            <Badge variant="outline" className="text-xs">
                                              <Users className="h-3 w-3 mr-1" />
                                              {key.usageCount}
                                            </Badge>
                                          </div>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                  Use one of our managed API keys. No setup required!
                                </p>
                              </div>
                            ) : (
                              <div className="text-center py-4">
                                <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">
                                  No platform keys available for {newIntegration.serviceName}
                                </p>
                              </div>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Integration'}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            {integrations.length === 0 ? (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No integrations yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first API integration.
                </p>
                <Button onClick={() => setShowAddModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Integration
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {integrations.map((integration) => (
                  <Card key={integration.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-medium">{integration.name}</h3>
                              {getStatusBadge(integration.healthStatus)}
                              {getKeySourceBadge(integration.keySource, integration.platformKey)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span className="capitalize">{integration.serviceName}</span>
                              <span>•</span>
                              <span>Created {formatDate(integration.createdAt)}</span>
                              {integration.lastHealthCheck && (
                                <>
                                  <span>•</span>
                                  <span>Last checked {formatDate(integration.lastHealthCheck)}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleHealthCheck(integration.id)}
                            disabled={healthCheckLoading === integration.id}
                          >
                            {healthCheckLoading === integration.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current" />
                            ) : (
                              <Activity className="h-3 w-3" />
                            )}
                            <span className="ml-1">Check</span>
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {integration.serviceName === 'apollo' && integration.healthStatus === 'healthy' && (
                                <>
                                  <DropdownMenuItem onClick={() => router.push('/dashboard/apollo-search')}>
                                    <Search className="mr-2 h-4 w-4" />
                                    People Search
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {integration.serviceName === 'openai' && integration.healthStatus === 'healthy' && (
                                <>
                                  <DropdownMenuItem onClick={() => router.push('/dashboard/openai-text-generation')}>
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Text Generation
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {integration.serviceName === 'leadmagic' && integration.healthStatus === 'healthy' && (
                                <>
                                  <DropdownMenuItem onClick={() => router.push('/dashboard/leadmagic-email-finder')}>
                                    <Search className="mr-2 h-4 w-4" />
                                    Email Finder
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              <DropdownMenuItem onClick={() => copyToClipboard(integration.id)}>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy ID
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteIntegration(integration.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 