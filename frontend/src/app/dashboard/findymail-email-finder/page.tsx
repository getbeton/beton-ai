'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api';

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Findymail Email Finder</h1>
      
      <Card className="p-6">
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
            {loading ? 'Searching...' : 'Find Email'}
          </Button>
        </form>

        {error && (
          <Alert variant="destructive" className="mt-4">
            {error}
          </Alert>
        )}

        {result && (
          <Alert className="mt-4">
            Found email: {result.email}
          </Alert>
        )}
      </Card>
    </div>
  );
} 