'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient, type Integration } from '@/lib/api';
import { 
  Sparkles, 
  Send, 
  Loader2,
  Copy,
  Download,
  RotateCcw,
  Settings,
  Brain,
  AlertCircle
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { copyToClipboard } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import MainNavigation from '@/components/navigation/MainNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';

interface OpenAIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
}

interface OpenAIResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}

export default function OpenAITextGenerationPage() {
  const [user, setUser] = useState<any>(null);
  const [openaiIntegrations, setOpenaiIntegrations] = useState<Integration[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<OpenAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [request, setRequest] = useState<OpenAIRequest>({
    prompt: '',
    model: 'gpt-4o-mini',
    maxTokens: 1000,
    temperature: 0.7,
    systemPrompt: ''
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
        await fetchOpenAIIntegrations();
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

  const fetchOpenAIIntegrations = async () => {
    try {
      const response = await apiClient.integrations.list();
      if (response.data.success) {
        const openaiIntegrations = response.data.data.filter(
          (integration: Integration) => integration.serviceName === 'openai' && integration.isActive
        );
        setOpenaiIntegrations(openaiIntegrations);
        
        // Auto-select first integration if available
        if (openaiIntegrations.length > 0) {
          setSelectedIntegration(openaiIntegrations[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching OpenAI integrations:', error);
      toast.error('Failed to load OpenAI integrations');
    }
  };

  const handleGenerate = async () => {
    if (!selectedIntegration) {
      toast.error('Please select an OpenAI integration first');
      return;
    }

    if (!request.prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.integrations.openaiTextGeneration(selectedIntegration, request);
      
      if (response.data.success) {
        setResult(response.data.data);
        toast.success('Text generated successfully!');
      } else {
        toast.error('Failed to generate text');
      }
    } catch (error: any) {
      console.error('Error generating text:', error);
      const errorMessage = error.response?.data?.error || 'An error occurred during text generation';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyResult = () => {
    if (result) {
      copyToClipboard(result.content);
      toast.success('Result copied to clipboard');
    }
  };

  const handleReset = () => {
    setRequest({
      prompt: '',
      model: 'gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7,
      systemPrompt: ''
    });
    setResult(null);
    setError(null);
  };

  const calculateCost = (usage: any) => {
    // Basic cost calculation (simplified)
    const costPer1KTokens = 0.0015; // Approximate cost for gpt-4o-mini
    return ((usage.totalTokens / 1000) * costPer1KTokens).toFixed(4);
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
            { label: 'OpenAI Text Generation', href: '/dashboard/openai-text-generation' }
          ]} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">OpenAI Text Generation</h1>
          </div>
          <p className="text-muted-foreground">
            Generate text using OpenAI's powerful language models
          </p>
        </div>

        {openaiIntegrations.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No OpenAI integrations found</h3>
                <p className="text-muted-foreground mb-4">
                  You need to set up an OpenAI integration first to use text generation.
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
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Text Generation</span>
                </CardTitle>
                <CardDescription>
                  Configure your text generation request
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Integration Selection */}
                <div className="space-y-2">
                  <Label htmlFor="integration">OpenAI Integration</Label>
                  <Select value={selectedIntegration} onValueChange={setSelectedIntegration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an integration" />
                    </SelectTrigger>
                    <SelectContent>
                      {openaiIntegrations.map((integration) => (
                        <SelectItem key={integration.id} value={integration.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{integration.name}</span>
                            <Badge variant="outline" className="ml-2">
                              {integration.healthStatus}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* System Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="systemPrompt">System Prompt (Optional)</Label>
                  <Textarea
                    id="systemPrompt"
                    placeholder="You are a helpful assistant..."
                    value={request.systemPrompt}
                    onChange={(e) => setRequest({ ...request, systemPrompt: e.target.value })}
                    rows={3}
                  />
                </div>

                {/* User Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="prompt">Prompt *</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Enter your prompt here..."
                    value={request.prompt}
                    onChange={(e) => setRequest({ ...request, prompt: e.target.value })}
                    rows={4}
                    required
                  />
                </div>

                {/* Model and Parameters */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="model">Model</Label>
                    <Select value={request.model} onValueChange={(value) => setRequest({ ...request, model: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxTokens">Max Tokens</Label>
                    <Input
                      id="maxTokens"
                      type="number"
                      min="1"
                      max="4000"
                      value={request.maxTokens}
                      onChange={(e) => setRequest({ ...request, maxTokens: parseInt(e.target.value) || 1000 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {request.temperature}</Label>
                  <Input
                    id="temperature"
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={request.temperature}
                    onChange={(e) => setRequest({ ...request, temperature: parseFloat(e.target.value) })}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Focused</span>
                    <span>Creative</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={generating || !request.prompt.trim()}
                    className="flex-1"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Generate
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleReset}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card>
              <CardHeader>
                <CardTitle>Generated Text</CardTitle>
                <CardDescription>
                  {result ? `Generated using ${result.model}` : 'Results will appear here'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <Alert className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {result ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="whitespace-pre-wrap text-sm">{result.content}</div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-4 text-sm text-muted-foreground">
                        <span>{result.usage.totalTokens} tokens</span>
                        <span>~${calculateCost(result.usage)} cost</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopyResult}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>

                    <Separator />

                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>Model: {result.model}</div>
                      <div>Finish Reason: {result.finishReason}</div>
                      <div>Prompt Tokens: {result.usage.promptTokens}</div>
                      <div>Completion Tokens: {result.usage.completionTokens}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Enter a prompt and click generate to see results
                    </p>
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