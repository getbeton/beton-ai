/**
 * WebhookInfoCard
 * 
 * Displays incoming webhook information prominently on the table detail page.
 * Shows webhook URL, API key (with visibility toggle), status, and statistics.
 * 
 * Features:
 * - One-click copy for webhook URL
 * - One-click copy for API key (with show/hide toggle)
 * - Active/Paused status badge
 * - Webhook statistics (total received, last received)
 * - Empty state with setup button
 * 
 * @example
 * <WebhookInfoCard
 *   webhook={incomingWebhook}
 *   loading={isLoading}
 *   onSetupClick={() => setShowWebhookModal(true)}
 * />
 */

'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Check, Eye, EyeOff, Webhook, Link as LinkIcon, Key, TrendingUp, Clock } from 'lucide-react';
import { IncomingWebhook } from './types';
import { toast } from 'sonner';

interface WebhookInfoCardProps {
  webhook: IncomingWebhook | null;
  loading: boolean;
  onSetupClick: () => void;
}

export const WebhookInfoCard: React.FC<WebhookInfoCardProps> = ({
  webhook,
  loading,
  onSetupClick,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    if (!webhook?.url) return;
    
    try {
      await navigator.clipboard.writeText(webhook.url);
      setCopiedUrl(true);
      toast.success('Webhook URL copied to clipboard');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Copy API key to clipboard
  const copyApiKey = async () => {
    if (!webhook?.apiKey) return;
    
    try {
      await navigator.clipboard.writeText(webhook.apiKey);
      setCopiedKey(true);
      toast.success('API key copied to clipboard');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  // Mask API key for display
  const maskedApiKey = webhook?.apiKey 
    ? `${webhook.apiKey.slice(0, 8)}${'*'.repeat(24)}`
    : '';

  // Show loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" />
            Incoming Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            Loading webhook configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show empty state if no webhook
  if (!webhook) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" />
            Incoming Webhook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Webhook className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mb-2 text-sm font-medium">No webhook configured</p>
            <p className="mb-4 text-xs text-muted-foreground">
              Create a webhook to receive data from external services
            </p>
            <Button onClick={onSetupClick} size="sm">
              <Webhook className="mr-2 h-4 w-4" />
              Set Up Webhook
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show webhook information
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4" />
            Incoming Webhook
            <Badge
              variant={webhook.isActive ? 'default' : 'secondary'}
              className={webhook.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : ''}
            >
              {webhook.isActive ? 'Active' : 'Paused'}
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Webhook URL */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
            Webhook URL
          </div>
          <div className="flex gap-2">
            <Input
              value={webhook.url}
              readOnly
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={copyWebhookUrl}
              title="Copy webhook URL"
            >
              {copiedUrl ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* API Key */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Key className="h-4 w-4 text-muted-foreground" />
            API Key
            <span className="text-xs font-normal text-muted-foreground">(required for authentication)</span>
          </div>
          <div className="flex gap-2">
            <Input
              value={showApiKey ? webhook.apiKey : maskedApiKey}
              readOnly
              type={showApiKey ? 'text' : 'password'}
              className="font-mono text-xs"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowApiKey(!showApiKey)}
              title={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={copyApiKey}
              title="Copy API key"
            >
              {copiedKey ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Statistics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
              <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Received</p>
              <p className="text-lg font-semibold">{webhook.receivedCount || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-300" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Received</p>
              <p className="text-sm font-medium">
                {webhook.lastReceivedAt
                  ? new Date(webhook.lastReceivedAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Never'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};



