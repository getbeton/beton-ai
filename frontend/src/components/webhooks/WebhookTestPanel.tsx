/**
 * WebhookTestPanel
 * 
 * Shared test interface for both incoming and outbound webhooks.
 * Allows users to test webhook configurations before going live.
 * 
 * Features:
 * - JSON payload editor (incoming only)
 * - Test button with loading state
 * - Response display (success/error)
 * - Response time metrics
 * 
 * @example
 * <WebhookTestPanel
 *   type="incoming"
 *   onTest={handleTest}
 *   showPayloadInput={true}
 * />
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { validateJSON } from './types';

interface TestResult {
  success: boolean;
  message: string;
  data?: any;
  statusCode?: number;
  responseTime?: number;
  error?: string;
}

interface WebhookTestPanelProps {
  type: 'incoming' | 'outbound';
  onTest: (payload?: any) => Promise<TestResult>;
  showPayloadInput?: boolean;
  defaultPayload?: string;
}

export const WebhookTestPanel: React.FC<WebhookTestPanelProps> = ({
  type,
  onTest,
  showPayloadInput = false,
  defaultPayload = '',
}) => {
  const [payload, setPayload] = useState(defaultPayload || '{\n  "email": "test@example.com",\n  "name": "John Doe"\n}');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  // Handle payload change and validate JSON
  const handlePayloadChange = (value: string) => {
    setPayload(value);
    setJsonError(null);
    
    if (value.trim()) {
      const validation = validateJSON(value);
      if (!validation.valid) {
        setJsonError(validation.error || 'Invalid JSON');
      }
    }
  };

  // Handle test execution
  const handleTest = async () => {
    // Validate JSON if payload input is shown
    if (showPayloadInput) {
      const validation = validateJSON(payload);
      if (!validation.valid) {
        setJsonError(validation.error || 'Invalid JSON');
        return;
      }
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const parsedPayload = showPayloadInput ? JSON.parse(payload) : undefined;
      const testResult = await onTest(parsedPayload);
      setResult(testResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: 'Test failed',
        error: error.message || 'An unexpected error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {type === 'incoming' 
            ? 'Test your webhook by sending a sample JSON payload. The system will process it and show you the result.'
            : 'Send a test request to your webhook URL to verify it\'s working correctly.'}
        </AlertDescription>
      </Alert>

      {/* Payload Input (for incoming webhooks) */}
      {showPayloadInput && (
        <div className="space-y-2">
          <Label htmlFor="test-payload">Test Payload (JSON)</Label>
          <Textarea
            id="test-payload"
            value={payload}
            onChange={(e) => handlePayloadChange(e.target.value)}
            placeholder='{\n  "email": "test@example.com",\n  "name": "John Doe"\n}'
            className="font-mono text-sm min-h-[200px]"
          />
          {jsonError && (
            <p className="text-xs text-destructive">{jsonError}</p>
          )}
        </div>
      )}

      {/* Test Button */}
      <Button
        onClick={handleTest}
        disabled={isLoading || (showPayloadInput && !!jsonError)}
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Testing...
          </>
        ) : (
          <>
            <Play className="h-4 w-4 mr-2" />
            Send Test {type === 'incoming' ? 'Data' : 'Request'}
          </>
        )}
      </Button>

      {/* Test Result */}
      {result && (
        <div className="space-y-3">
          {/* Result Status */}
          <Alert
            variant={result.success ? 'default' : 'destructive'}
            className={result.success ? 'border-green-200 bg-green-50' : ''}
          >
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertDescription className={result.success ? 'text-green-800' : ''}>
              <strong>{result.message}</strong>
              {result.responseTime && (
                <span className="ml-2 text-xs">
                  ({result.responseTime}ms)
                </span>
              )}
              {result.statusCode && (
                <span className="ml-2 text-xs">
                  Status: {result.statusCode}
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Result Data */}
          {result.data && (
            <div className="space-y-2">
              <Label>Response Data:</Label>
              <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[300px]">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}

          {/* Error Details */}
          {result.error && (
            <div className="space-y-2">
              <Label>Error Details:</Label>
              <pre className="p-3 bg-destructive/10 rounded text-xs font-mono overflow-x-auto">
                {result.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


