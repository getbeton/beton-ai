'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, leadmagicApi, type Integration } from '@/lib/api';
import { 
  Search,
  Send, 
  Loader2,
  Copy,
  Settings,
  Mail,
  AlertCircle,
  Building,
  User
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { copyToClipboard } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import MainNavigation from '@/components/navigation/MainNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';

interface EmailFinderRequest {
  firstName: string;
  lastName: string;
  domain?: string;
  companyName?: string;
}

interface EmailFinderResponse {
  email: string;
  status: string;
  creditsConsumed: number;
  message: string;
  companyInfo: {
    name: string;
    industry: string;
    size: string;
    location: {
      name: string;
      country: string;
    };
  };
}

export default function LeadMagicEmailFinderPage() {
  const [user, setUser] = useState<any>(null);
  const [leadmagicIntegrations, setLeadmagicIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<EmailFinderResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [request, setRequest] = useState<EmailFinderRequest>({
    firstName: '',
    lastName: '',
    domain: '',
    companyName: ''
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
        await fetchLeadMagicIntegrations();
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

  const fetchLeadMagicIntegrations = async () => {
    try {
      const response = await apiClient.integrations.list();
      if (response.data.success) {
        const leadmagicIntegrations = response.data.data.filter(
          (integration: Integration) => integration.serviceName === 'leadmagic' && integration.isActive
        );
        setLeadmagicIntegrations(leadmagicIntegrations);
        
        // Auto-select first integration if available
        if (leadmagicIntegrations.length > 0) {
          setSelectedIntegration(leadmagicIntegrations[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching LeadMagic integrations:', error);
      toast.error('Failed to load LeadMagic integrations');
    }
  };

  const handleSearch = async () => {
    if (!selectedIntegration) {
      toast.error('Please set up a LeadMagic integration first');
      return;
    }

    if (!request.firstName || !request.lastName) {
      toast.error('First name and last name are required');
      return;
    }

    if (!request.domain && !request.companyName) {
      toast.error('Either domain or company name is required');
      return;
    }

    setSearching(true);
    setError(null);
    setResult(null);

    try {
      // Get API key from integration
      const apiKey = selectedIntegration.apiKeys?.[0]?.apiKey || '';
      
      const response = await leadmagicApi.findEmail(apiKey, request);
      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Email found successfully!');
      } else {
        toast.error('Failed to find email');
      }
    } catch (error: any) {
      console.error('Error finding email:', error);
      const errorMessage = error.response?.data?.error || 'An error occurred while searching for email';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSearching(false);
    }
  };

  const handleCopyEmail = () => {
    if (result?.email) {
      copyToClipboard(result.email);
      toast.success('Email copied to clipboard');
    }
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
            { label: 'LeadMagic Email Finder', href: '/dashboard/leadmagic-email-finder' }
          ]} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Mail className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">LeadMagic Email Finder</h1>
          </div>
          <p className="text-muted-foreground">
            Find verified business email addresses with high accuracy
          </p>
        </div>

        {leadmagicIntegrations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No LeadMagic integrations found</h3>
                <p className="text-muted-foreground mb-4">
                  You need to set up a LeadMagic integration first to use email finder.
                </p>
                <Button onClick={() => router.push('/dashboard/integrations')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Integrations
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Form */}
            <Card>
              <CardHeader>
                <CardTitle>Find Email Address</CardTitle>
                <CardDescription>
                  Enter the person's details to find their business email
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="space-y-4">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        placeholder="John"
                        value={request.firstName}
                        onChange={(e) => setRequest({ ...request, firstName: e.target.value })}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        placeholder="Doe"
                        value={request.lastName}
                        onChange={(e) => setRequest({ ...request, lastName: e.target.value })}
                      />
                    </div>
                    <Separator />
                    <div className="grid gap-2">
                      <Label htmlFor="domain">Company Domain</Label>
                      <Input
                        id="domain"
                        placeholder="company.com"
                        value={request.domain}
                        onChange={(e) => setRequest({ ...request, domain: e.target.value })}
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter either domain or company name
                      </p>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        placeholder="Company Inc."
                        value={request.companyName}
                        onChange={(e) => setRequest({ ...request, companyName: e.target.value })}
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={searching}
                  >
                    {searching ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Find Email
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  Email finder results and company information
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {result && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Found Email</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyEmail}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-lg font-mono">{result.email}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        <Badge variant={result.status === 'valid' ? 'default' : 'secondary'}>
                          {result.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {result.creditsConsumed} credit(s) used
                        </span>
                      </div>
                    </div>

                    {result.companyInfo && (
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center">
                          <Building className="h-4 w-4 mr-2" />
                          Company Information
                        </h4>
                        <div className="grid gap-2 text-sm">
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Name</span>
                            <span className="font-medium">{result.companyInfo.name}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Industry</span>
                            <span className="font-medium">{result.companyInfo.industry || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Size</span>
                            <span className="font-medium">{result.companyInfo.size}</span>
                          </div>
                          <div className="flex justify-between py-1 border-b">
                            <span className="text-muted-foreground">Location</span>
                            <span className="font-medium">
                              {result.companyInfo.location.name}, {result.companyInfo.location.country}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!result && !error && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter details and click "Find Email" to search</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
} 