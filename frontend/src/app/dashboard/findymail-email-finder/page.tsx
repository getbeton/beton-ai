'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';
import DashboardShell from '@/components/layout/DashboardShell';
import { Loader2, Mail } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface Integration {
  id: string;
  name: string;
}

export default function FindymailEmailFinder() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ email: string } | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [integrations, setIntegrations] = useState<Integration[]>([]);

  useEffect(() => {
    const loadIntegrations = async () => {
      try {
        const response = await apiClient.integrations.list();
        const findymailIntegrations = response.data.data.filter(
          integration => integration.serviceName === 'findymail' && integration.isActive
        );
        setIntegrations(findymailIntegrations);
      } catch (err) {
        setError('Failed to load integrations');
      }
    };

    loadIntegrations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      if (!selectedIntegration) {
        throw new Error('Please select an integration');
      }

      const response = await apiClient.integrations.findymailFindEmail(selectedIntegration, {
        name,
        domain
      });

      if (response.data?.success) {
        setResult({ email: response.data.data.contact.email });
      } else {
        throw new Error(response.data?.error || 'Failed to find email');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardShell
      title="Findymail Email Finder"
      description="Find business email addresses using Findymail"
    >
      <Toaster position="top-right" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Finder
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="integration">Integration</Label>
              <Select
                value={selectedIntegration}
                onValueChange={setSelectedIntegration}
              >
                <SelectTrigger id="integration">
                  <SelectValue placeholder="Select integration" />
                </SelectTrigger>
                <SelectContent>
                  {integrations.map(integration => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {integration.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                required
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Find Email
                </>
              )}
            </Button>
          </form>

          {error && (
            <Alert variant="destructive" className="mt-4">
              {error}
            </Alert>
          )}

          {result && (
            <Alert className="mt-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Found email: <strong>{result.email}</strong>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </DashboardShell>
  );
} 