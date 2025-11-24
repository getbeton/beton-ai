/**
 * IncomingWebhookModal
 * 
 * Simplified single-flow modal for configuring incoming webhooks.
 * Consolidates setup, testing, and field mapping into one screen.
 * Shows success state with webhook URL and API key after creation.
 * 
 * Features:
 * - Single-screen flow (no tabs for new webhooks)
 * - Inline JSON testing and field extraction
 * - Real-time field mapping validation
 * - Success screen with copyable URL and API key
 * - Separate manage mode for existing webhooks
 * 
 * @example
 * <IncomingWebhookModal
 *   open={showModal}
 *   onClose={() => setShowModal(false)}
 *   tableId="clx123..."
 *   tableName="My Table"
 *   tableColumns={columns}
 *   existingWebhook={webhook}
 *   onWebhookUpdated={handleUpdate}
 * />
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check, AlertCircle, Loader2, Trash2, Pause, Play, Eye, EyeOff, CheckCircle2, Link as LinkIcon, Key } from 'lucide-react';
import { FieldMappingBuilder } from './FieldMappingBuilder';
import { IncomingWebhook, TableColumn, validateJSON } from './types';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface IncomingWebhookModalProps {
  open: boolean;
  onClose: () => void;
  tableId: string;
  tableName: string;
  tableColumns: TableColumn[];
  existingWebhook?: IncomingWebhook | null;
  onWebhookUpdated: (webhook: IncomingWebhook | null) => void;
}

export const IncomingWebhookModal: React.FC<IncomingWebhookModalProps> = ({
  open,
  onClose,
  tableId,
  tableName,
  tableColumns,
  existingWebhook,
  onWebhookUpdated,
}) => {
  const router = useRouter();

  // UI state
  const [mode, setMode] = useState<'setup' | 'success' | 'manage'>('setup');
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [sampleJson, setSampleJson] = useState('{\n  "email": "test@example.com",\n  "firstName": "John",\n  "lastName": "Doe"\n}');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [webhook, setWebhook] = useState<IncomingWebhook | null>(null);

  // Success state
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedBoth, setCopiedBoth] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Initialize state when modal opens or webhook changes
  useEffect(() => {
    if (open) {
      if (existingWebhook) {
        // Load existing webhook - go to manage mode
        setWebhook(existingWebhook);
        setFieldMapping(existingWebhook.fieldMapping || {});
        setIsActive(existingWebhook.isActive);
        setMode('manage');

        // Extract fields from existing mapping
        const fields = Object.keys(existingWebhook.fieldMapping || {});
        setAvailableFields(fields);
      } else {
        // New webhook - setup mode
        setWebhook(null);
        setMode('setup');
        setFieldMapping({});
        setAvailableFields([]);
        setSampleJson('{\n  "email": "test@example.com",\n  "firstName": "John",\n  "lastName": "Doe"\n}');
      }
    }
  }, [open, existingWebhook]);

  // Extract fields from sample JSON
  const extractFieldsFromJson = useCallback(() => {
    const validation = validateJSON(sampleJson);
    if (validation.valid && validation.parsed) {
      const fields = Object.keys(validation.parsed);
      setAvailableFields(fields);

      // Auto-map fields with matching column names
      const autoMapping: Record<string, string> = {};
      fields.forEach(field => {
        const matchingColumn = tableColumns.find(
          col => col.name.toLowerCase() === field.toLowerCase()
        );
        if (matchingColumn) {
          autoMapping[field] = matchingColumn.id;
        }
      });
      setFieldMapping(prev => ({ ...prev, ...autoMapping }));

      toast.success(`Extracted ${fields.length} fields from sample JSON`);
    } else {
      toast.error(validation.error || 'Invalid JSON');
    }
  }, [sampleJson, tableColumns]);

  // Validate mapping
  const isValidMapping = useCallback(() => {
    if (Object.keys(fieldMapping).length === 0) {
      return false;
    }

    // Check that all required columns are mapped
    const requiredColumns = tableColumns.filter(col => col.isRequired);
    const mappedColumnIds = Object.values(fieldMapping);
    const unmappedRequired = requiredColumns.filter(col => !mappedColumnIds.includes(col.id));

    return unmappedRequired.length === 0;
  }, [fieldMapping, tableColumns]);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    if (!webhook?.url) return;

    try {
      await navigator.clipboard.writeText(webhook.url);
      setCopiedUrl(true);
      toast.success('Webhook URL copied');
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
      toast.success('API key copied');
      setTimeout(() => setCopiedKey(false), 2000);
    } catch (error) {
      toast.error('Failed to copy API key');
    }
  };

  // Copy both URL and API key
  const copyBoth = async () => {
    if (!webhook?.url || !webhook?.apiKey) return;

    try {
      const text = `Webhook URL: ${webhook.url}\nAPI Key: ${webhook.apiKey}`;
      await navigator.clipboard.writeText(text);
      setCopiedBoth(true);
      toast.success('URL and API key copied');
      setTimeout(() => setCopiedBoth(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Save webhook configuration
  const handleSave = async () => {
    // For new webhooks with sample JSON, we don't need to validate mapping
    // The backend will auto-create columns and mapping
    if (!webhook && sampleJson) {
      // Validate JSON is parseable
      const validation = validateJSON(sampleJson);
      if (!validation.valid) {
        toast.error(validation.error || 'Invalid JSON');
        return;
      }
    } else if (!webhook && !sampleJson) {
      // If no sample JSON, validate mapping manually
      if (!isValidMapping()) {
        toast.error('Please provide sample JSON or map all required fields');
        return;
      }
    }

    setIsSaving(true);

    try {
      if (webhook) {
        // Update existing webhook
        const response = await apiClient.webhooks.updateIncoming(webhook.id, {
          fieldMapping,
          isActive,
        });

        if (response.data.success) {
          const updatedWebhook = response.data.data;
          setWebhook(updatedWebhook);
          onWebhookUpdated(updatedWebhook);
          toast.success('Webhook updated successfully');
        }
      } else {
        // Create new webhook with sample JSON for auto-column creation
        const response = await apiClient.webhooks.createIncoming({
          tableId,
          sampleJson: sampleJson, // Send sample JSON to backend
          isActive: true, // Always set to active
        });

        if (response.data.success) {
          const newWebhook = response.data.data;
          setWebhook(newWebhook);
          onWebhookUpdated(newWebhook);
          toast.success('Webhook created successfully! Columns have been auto-created.');
          // Show success screen
          setMode('success');
        }
      }
    } catch (error: any) {
      console.error('[IncomingWebhookModal] Save failed:', error);
      toast.error(error.response?.data?.error || 'Failed to save webhook');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle webhook active state
  const handleToggleActive = async () => {
    if (!webhook) return;

    try {
      const response = await apiClient.webhooks.updateIncoming(webhook.id, {
        isActive: !isActive,
      });

      if (response.data.success) {
        const updatedWebhook = response.data.data;
        setWebhook(updatedWebhook);
        setIsActive(updatedWebhook.isActive);
        onWebhookUpdated(updatedWebhook);
        toast.success(`Webhook ${updatedWebhook.isActive ? 'activated' : 'paused'}`);
      }
    } catch (error: any) {
      console.error('[IncomingWebhookModal] Toggle failed:', error);
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
      const response = await apiClient.webhooks.deleteIncoming(webhook.id);

      if (response.data.success) {
        toast.success('Webhook deleted successfully');
        onWebhookUpdated(null);
        onClose();
      }
    } catch (error: any) {
      console.error('[IncomingWebhookModal] Delete failed:', error);
      toast.error(error.response?.data?.error || 'Failed to delete webhook');
    } finally {
      setIsDeleting(false);
    }
  };

  // Go to table after webhook creation
  const handleGoToTable = () => {
    onClose();
    router.push(`/dashboard/tables/${tableId}`);
  };

  // Get required fields that are not mapped
  const unmappedRequiredFields = tableColumns
    .filter(col => col.isRequired)
    .filter(col => !Object.values(fieldMapping).includes(col.id))
    .map(col => col.name);

  // Mask API key for display
  const maskedApiKey = webhook?.apiKey
    ? `${webhook.apiKey.slice(0, 8)}${'*'.repeat(24)}`
    : '';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* ========== SETUP MODE (New Webhook) ========== */}
        {mode === 'setup' && (
          <>
            <DialogHeader>
              <DialogTitle>Configure Incoming Webhook</DialogTitle>
              <DialogDescription>
                Paste sample JSON data to automatically create table columns for {tableName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Sample JSON Input */}
              <div className="space-y-3">
                <Label htmlFor="sample-json" className="text-base font-semibold">
                  Paste Sample JSON Data
                </Label>
                <Textarea
                  id="sample-json"
                  value={sampleJson}
                  onChange={(e) => setSampleJson(e.target.value)}
                  placeholder='{\n  "email": "test@example.com",\n  "firstName": "John",\n  "lastName": "Doe"\n}'
                  className="font-mono text-sm min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Table columns will be automatically created from the JSON keys
                </p>
              </div>

              {/* Info about webhook */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>One-click setup:</strong> When you click "Create Webhook", we'll automatically create table columns from your JSON keys and generate your webhook URL and API key. The webhook will be set to active immediately.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !sampleJson.trim()}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Webhook'
                )}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ========== SUCCESS MODE (Just Created) ========== */}
        {mode === 'success' && webhook && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Webhook Created Successfully!
              </DialogTitle>
              <DialogDescription>
                Copy your webhook URL and API key. The API key won't be shown again.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
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
                  >
                    {copiedUrl ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* API Key */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  API Key (required for authentication)
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
                  >
                    {copiedKey ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Warning */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Save your API key securely.</strong> It won't be shown again for security reasons.
                  You can always find the webhook URL on your table page.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={copyBoth}
                className="w-full sm:w-auto"
              >
                {copiedBoth ? (
                  <>
                    <Check className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Both
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleGoToTable}
                className="w-full sm:w-auto"
              >
                Go to Table
              </Button>
              <Button
                onClick={onClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ========== MANAGE MODE (Existing Webhook) ========== */}
        {mode === 'manage' && webhook && (
          <>
            <DialogHeader>
              <DialogTitle>
                Manage Incoming Webhook
                <Badge
                  variant={webhook.isActive ? 'default' : 'secondary'}
                  className={webhook.isActive ? 'ml-2 bg-green-100 text-green-800' : 'ml-2'}
                >
                  {webhook.isActive ? 'Active' : 'Paused'}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Configure your webhook for {tableName}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="configuration" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="configuration">Configuration</TabsTrigger>
                <TabsTrigger value="stats">Statistics</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Configuration Tab */}
              <TabsContent value="configuration" className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={webhook.url}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyWebhookUrl}
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

                <div className="space-y-2">
                  <Label>Field Mapping</Label>
                  <FieldMappingBuilder
                    availableFields={availableFields}
                    tableColumns={tableColumns}
                    mapping={fieldMapping}
                    onChange={setFieldMapping}
                  />
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !isValidMapping()}
                  className="w-full"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Webhook'
                  )}
                </Button>
              </TabsContent>

              {/* Statistics Tab */}
              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{webhook.receivedCount || 0}</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Last Received</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">
                        {webhook.lastReceivedAt
                          ? new Date(webhook.lastReceivedAt).toLocaleString()
                          : 'Never'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Webhook Status</p>
                    <p className="text-xs text-muted-foreground">
                      {isActive ? 'Webhook is active and receiving data' : 'Webhook is paused'}
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

                <Separator />

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
              </TabsContent>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
