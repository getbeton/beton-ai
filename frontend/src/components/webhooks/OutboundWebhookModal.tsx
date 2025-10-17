/**
 * OutboundWebhookModal
 * 
 * Main modal for configuring outbound webhooks with URL configuration,
 * event selection, delivery history, and settings.
 * 
 * Features:
 * - 3-tab interface (Configuration, Deliveries, Settings)
 * - URL validation
 * - Event selection (row.created, row.updated, row.deleted)
 * - Payload preview
 * - Test webhook functionality
 * - Delivery history view
 * - Pause/Resume webhook
 * 
 * @example
 * <OutboundWebhookModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   tableId="clx123..."
 *   tableName="My Table"
 *   existingWebhook={webhook}
 *   onWebhooksUpdated={handleUpdate}
 * />
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertCircle,
  Loader2,
  Trash2,
  Pause,
  Play,
  Send,
  ExternalLink,
} from 'lucide-react';
import { WebhookTestPanel } from './WebhookTestPanel';
import { WebhookDeliveryLog } from './WebhookDeliveryLog';
import {
  OutboundWebhook,
  WebhookEvent,
  WebhookDelivery,
  validateWebhookUrl,
} from './types';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

interface OutboundWebhookModalProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
  existingWebhook?: OutboundWebhook | null;
  onWebhooksUpdated: () => void;
}

export const OutboundWebhookModal: React.FC<OutboundWebhookModalProps> = ({
  open,
  onClose,
  tableId,
  tableName,
  existingWebhook,
  onWebhooksUpdated,
}) => {
  const [activeTab, setActiveTab] = useState('configuration');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>(['row.created']);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [webhook, setWebhook] = useState<OutboundWebhook | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);

  const allEvents: WebhookEvent[] = ['row.created', 'row.updated', 'row.deleted'];

  // Initialize state when modal opens or webhook changes
  useEffect(() => {
    if (open) {
      if (existingWebhook) {
        // Load existing webhook
        setWebhook(existingWebhook);
        setWebhookUrl(existingWebhook.url);
        setSelectedEvents(existingWebhook.events);
        setIsActive(existingWebhook.isActive);
        setActiveTab('configuration');
        fetchDeliveries(existingWebhook.id);
      } else {
        // Reset for new webhook
        setWebhook(null);
        setWebhookUrl('');
        setSelectedEvents(['row.created']);
        setIsActive(true);
        setActiveTab('configuration');
        setDeliveries([]);
      }
    }
  }, [open, existingWebhook]);

  // Fetch delivery history
  const fetchDeliveries = async (webhookId: string) => {
    try {
      setLoadingDeliveries(true);
      const response = await apiClient.webhooks.getDeliveries(webhookId);
      if (response.data.success && response.data.data) {
        setDeliveries(response.data.data);
      }
    } catch (error: any) {
      console.log('[OutboundWebhookModal] Failed to fetch deliveries:', error);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Validate webhook URL on change
  const handleUrlChange = (value: string) => {
    setWebhookUrl(value);
    
    if (value.trim()) {
      const validation = validateWebhookUrl(value);
      setUrlError(validation.valid ? null : validation.error || null);
      
      // Warn on HTTP (not HTTPS)
      if (validation.valid && value.startsWith('http://') && !value.includes('localhost')) {
        toast('HTTP is not secure. Consider using HTTPS.', { icon: '⚠️' });
      }
    } else {
      setUrlError(null);
    }
  };

  // Toggle event selection
  const handleEventToggle = (event: WebhookEvent) => {
    setSelectedEvents(prev => {
      if (prev.includes(event)) {
        return prev.filter(e => e !== event);
      } else {
        return [...prev, event];
      }
    });
  };

  // Save webhook configuration
  const handleSave = async () => {
    // Validate URL
    if (!webhookUrl.trim()) {
      toast.error('Please enter a webhook URL');
      return;
    }

    const validation = validateWebhookUrl(webhookUrl);
    if (!validation.valid) {
      toast.error(validation.error || 'Invalid webhook URL');
      return;
    }

    // Validate events
    if (selectedEvents.length === 0) {
      toast.error('Please select at least one event');
      return;
    }

    setIsSaving(true);
    
    try {
      if (webhook) {
        // Update existing webhook
        const response = await apiClient.webhooks.updateOutbound(webhook.id, {
          url: webhookUrl,
          events: selectedEvents,
          isActive,
        });
        
        if (response.data.success) {
          const updatedWebhook = response.data.data;
          setWebhook(updatedWebhook);
          toast.success('Webhook updated successfully');
          onWebhooksUpdated();
        }
      } else {
        // Create new webhook
        const response = await apiClient.webhooks.createOutbound({
          tableId,
          url: webhookUrl,
          events: selectedEvents,
          isActive,
        });
        
        if (response.data.success) {
          const newWebhook = response.data.data;
          setWebhook(newWebhook);
          toast.success('Webhook created successfully');
          onWebhooksUpdated();
          setActiveTab('settings');
        }
      }
    } catch (error: any) {
      console.error('[OutboundWebhookModal] Save failed:', error);
      toast.error(error.response?.data?.error || 'Failed to save webhook');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle webhook active state
  const handleToggleActive = async () => {
    if (!webhook) return;

    try {
      const response = await apiClient.webhooks.updateOutbound(webhook.id, {
        isActive: !isActive,
      });
      
      if (response.data.success) {
        const updatedWebhook = response.data.data;
        setWebhook(updatedWebhook);
        setIsActive(updatedWebhook.isActive);
        toast.success(`Webhook ${updatedWebhook.isActive ? 'activated' : 'paused'}`);
        onWebhooksUpdated();
      }
    } catch (error: any) {
      console.error('[OutboundWebhookModal] Toggle failed:', error);
      toast.error(error.response?.data?.error || 'Failed to toggle webhook');
    }
  };

  // Delete webhook
  const handleDelete = async () => {
    if (!webhook) return;
    
    if (!confirm('Are you sure you want to delete this webhook? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await apiClient.webhooks.deleteOutbound(webhook.id);
      
      if (response.data.success) {
        toast.success('Webhook deleted successfully');
        onWebhooksUpdated();
        onClose();
      }
    } catch (error: any) {
      console.error('[OutboundWebhookModal] Delete failed:', error);
      toast.error(error.response?.data?.error || 'Failed to delete webhook');
    } finally {
      setIsDeleting(false);
    }
  };

  // Test webhook
  const handleTestWebhook = async () => {
    if (!webhook) {
      return {
        success: false,
        message: 'No webhook configured',
        error: 'Please save the webhook before testing',
      };
    }

    try {
      const response = await apiClient.webhooks.testOutbound(webhook.id);
      
      if (response.data.success) {
        const result = response.data.data;
        return {
          success: result.success,
          message: result.success ? 'Test webhook sent successfully!' : 'Test webhook failed',
          statusCode: result.statusCode,
          responseTime: result.responseTime,
          data: result.responseBody,
          error: result.error,
        };
      } else {
        return {
          success: false,
          message: 'Test failed',
          error: 'Failed to send test webhook',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Test failed',
        error: error.response?.data?.error || error.message || 'An unexpected error occurred',
      };
    }
  };

  // Generate sample payload preview
  const getSamplePayload = () => {
    return {
      event: 'row.created',
      table: tableName,
      tableId: tableId,
      row: {
        id: 'example-row-id',
        createdAt: new Date().toISOString(),
        data: {
          'Column 1': 'Sample value',
          'Column 2': 'Another value',
        },
      },
    };
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Outbound Webhook
            {webhook && (
              <Badge
                variant={webhook.isActive ? 'default' : 'secondary'}
                className={webhook.isActive ? 'ml-2 bg-green-100 text-green-800' : 'ml-2'}
              >
                {webhook.isActive ? 'Active' : 'Paused'}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Send data to external services when events occur in {tableName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="deliveries" disabled={!webhook}>Deliveries</TabsTrigger>
            <TabsTrigger value="settings" disabled={!webhook}>Settings</TabsTrigger>
          </TabsList>

          {/* CONFIGURATION TAB */}
          <TabsContent value="configuration" className="space-y-4">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL *</Label>
              <Input
                id="webhook-url"
                value={webhookUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://api.example.com/webhook"
                className={urlError ? 'border-destructive' : ''}
              />
              {urlError && (
                <p className="text-xs text-destructive">{urlError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                The URL where webhook payloads will be sent
              </p>
            </div>

            <Separator />

            {/* Event Selection */}
            <div className="space-y-3">
              <Label>Events *</Label>
              <p className="text-xs text-muted-foreground">
                Select which events should trigger this webhook
              </p>
              
              <div className="space-y-2">
                {allEvents.map((event) => (
                  <div key={event} className="flex items-center space-x-2">
                    <Checkbox
                      id={event}
                      checked={selectedEvents.includes(event)}
                      onCheckedChange={() => handleEventToggle(event)}
                    />
                    <Label
                      htmlFor={event}
                      className="text-sm font-normal cursor-pointer"
                    >
                      {event}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Payload Preview */}
            <div className="space-y-2">
              <Label>Payload Preview</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Example of the JSON payload that will be sent to your webhook
              </p>
              <pre className="p-3 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[300px]">
                {JSON.stringify(getSamplePayload(), null, 2)}
              </pre>
            </div>

            {/* Test Webhook (if saved) */}
            {webhook && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label>Test Webhook</Label>
                  <WebhookTestPanel
                    type="outbound"
                    onTest={handleTestWebhook}
                    showPayloadInput={false}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* DELIVERIES TAB */}
          <TabsContent value="deliveries" className="space-y-4">
            {webhook && (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Deliveries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{webhook.deliveryCount || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Successful</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-green-600">
                        {webhook.successCount || 0}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Failed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-red-600">
                        {webhook.failureCount || 0}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Separator />

                {/* Delivery History */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label>Recent Deliveries</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchDeliveries(webhook.id)}
                    >
                      Refresh
                    </Button>
                  </div>
                  <WebhookDeliveryLog
                    webhookId={webhook.id}
                    deliveries={deliveries}
                    loading={loadingDeliveries}
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* SETTINGS TAB */}
          <TabsContent value="settings" className="space-y-4">
            {webhook && (
              <>
                {/* Webhook URL (Read-only) */}
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(webhookUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Active Events */}
                <div className="space-y-2">
                  <Label>Active Events</Label>
                  <div className="flex flex-wrap gap-2">
                    {webhook.events.map((event) => (
                      <Badge key={event} variant="outline">
                        {event}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Statistics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {new Date(webhook.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Last Delivery</p>
                    <p className="text-sm font-medium">
                      {webhook.lastDeliveryAt
                        ? new Date(webhook.lastDeliveryAt).toLocaleString()
                        : 'Never'}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Webhook Status</p>
                      <p className="text-xs text-muted-foreground">
                        {isActive ? 'Webhook is active and sending data' : 'Webhook is paused'}
                      </p>
                    </div>
                    <Button
                      variant={isActive ? 'outline' : 'default'}
                      onClick={handleToggleActive}
                    >
                      {isActive ? (
                        <>
                          <Pause className="h-4 w-4 mr-2" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>

                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <span>Delete this webhook permanently</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDelete}
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </>
                          )}
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        {activeTab === 'configuration' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !!urlError}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  {webhook ? 'Update Webhook' : 'Create Webhook'}
                </>
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};


