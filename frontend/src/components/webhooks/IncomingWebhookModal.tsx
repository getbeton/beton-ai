/**
 * IncomingWebhookModal
 * 
 * Main modal for configuring incoming webhooks with field mapping,
 * testing, and management capabilities.
 * 
 * Features:
 * - 3-tab interface (Setup, Test, Manage)
 * - Field mapping with dropdowns
 * - Live test with JSON preview
 * - Toggle webhook on/off
 * - View webhook statistics
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
import { Copy, Check, AlertCircle, Loader2, Trash2, Pause, Play } from 'lucide-react';
import { FieldMappingBuilder } from './FieldMappingBuilder';
import { WebhookTestPanel } from './WebhookTestPanel';
import { IncomingWebhook, TableColumn, validateJSON } from './types';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

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
  const [activeTab, setActiveTab] = useState('setup');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [sampleJson, setSampleJson] = useState('{\n  "email": "test@example.com",\n  "firstName": "John",\n  "lastName": "Doe"\n}');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [webhook, setWebhook] = useState<IncomingWebhook | null>(null);

  // Initialize state when modal opens or webhook changes
  useEffect(() => {
    if (open) {
      if (existingWebhook) {
        // Load existing webhook
        setWebhook(existingWebhook);
        setWebhookUrl(existingWebhook.url);
        setFieldMapping(existingWebhook.fieldMapping || {});
        setIsActive(existingWebhook.isActive);
        setActiveTab('manage');
        
        // Extract fields from existing mapping
        const fields = Object.keys(existingWebhook.fieldMapping || {});
        setAvailableFields(fields);
      } else {
        // Generate new webhook URL
        generateWebhookUrl();
        setActiveTab('setup');
      }
    }
  }, [open, existingWebhook]);

  // Generate unique webhook URL
  const generateWebhookUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const uniqueId = `${tableId}_${Date.now()}`;
    const url = `${baseUrl}/api/webhooks/receive/${uniqueId}`;
    setWebhookUrl(url);
  };

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
    }
  }, [sampleJson, tableColumns]);

  // Copy webhook URL to clipboard
  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedUrl(true);
      toast.success('Webhook URL copied to clipboard');
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  };

  // Save webhook configuration
  const handleSave = async () => {
    // Validate mapping
    if (Object.keys(fieldMapping).length === 0) {
      toast.error('Please configure at least one field mapping');
      return;
    }

    // Check required columns
    const requiredColumns = tableColumns.filter(col => col.isRequired);
    const mappedColumnIds = Object.values(fieldMapping);
    const unmappedRequired = requiredColumns.filter(col => !mappedColumnIds.includes(col.id));
    
    if (unmappedRequired.length > 0) {
      toast.error(`Required columns must be mapped: ${unmappedRequired.map(c => c.name).join(', ')}`);
      return;
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
          setActiveTab('manage');
        }
      } else {
        // Create new webhook
        const response = await apiClient.webhooks.createIncoming({
          tableId,
          fieldMapping,
          isActive,
        });
        
        if (response.data.success) {
          const newWebhook = response.data.data;
          setWebhook(newWebhook);
          setWebhookUrl(newWebhook.url);
          onWebhookUpdated(newWebhook);
          toast.success('Webhook created successfully');
          setActiveTab('manage');
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

  // Test webhook with sample data
  const handleTestWebhook = async (payload: any) => {
    try {
      // Simulate mapping the payload
      const mappedData: Record<string, any> = {};
      
      Object.entries(fieldMapping).forEach(([sourceField, targetColumnId]) => {
        if (payload[sourceField] !== undefined) {
          const column = tableColumns.find(col => col.id === targetColumnId);
          if (column) {
            mappedData[column.name] = payload[sourceField];
          }
        }
      });

      // Check if all required columns are mapped
      const requiredColumns = tableColumns.filter(col => col.isRequired);
      const missingColumns = requiredColumns.filter(
        col => !Object.keys(mappedData).includes(col.name)
      );

      if (missingColumns.length > 0) {
        return {
          success: false,
          message: 'Missing required fields',
          error: `The following required columns were not provided: ${missingColumns.map(c => c.name).join(', ')}`,
        };
      }

      return {
        success: true,
        message: 'Test successful! Here\'s how your data would be mapped:',
        data: mappedData,
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Test failed',
        error: error.message || 'An unexpected error occurred',
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Incoming Webhook
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
            Receive data from external services and automatically create rows in {tableName}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
            <TabsTrigger value="manage" disabled={!webhook}>Manage</TabsTrigger>
          </TabsList>

          {/* SETUP TAB */}
          <TabsContent value="setup" className="space-y-4">
            {/* Webhook URL */}
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
                  onClick={copyWebhookUrl}
                >
                  {copiedUrl ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Send POST requests to this URL to create rows automatically
              </p>
            </div>

            <Separator />

            {/* Sample JSON Input */}
            <div className="space-y-2">
              <Label htmlFor="sample-json">Sample JSON Payload</Label>
              <Textarea
                id="sample-json"
                value={sampleJson}
                onChange={(e) => setSampleJson(e.target.value)}
                placeholder='{\n  "email": "test@example.com",\n  "name": "John Doe"\n}'
                className="font-mono text-sm min-h-[150px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={extractFieldsFromJson}
              >
                Extract Fields
              </Button>
            </div>

            <Separator />

            {/* Field Mapping */}
            <div className="space-y-2">
              <Label>Field Mapping</Label>
              <FieldMappingBuilder
                availableFields={availableFields}
                tableColumns={tableColumns}
                mapping={fieldMapping}
                onChange={setFieldMapping}
              />
            </div>
          </TabsContent>

          {/* TEST TAB */}
          <TabsContent value="test" className="space-y-4">
            <WebhookTestPanel
              type="incoming"
              onTest={handleTestWebhook}
              showPayloadInput={true}
              defaultPayload={sampleJson}
            />
          </TabsContent>

          {/* MANAGE TAB */}
          <TabsContent value="manage" className="space-y-4">
            {webhook && (
              <>
                {/* Webhook URL */}
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

                {/* Statistics */}
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

                <Separator />

                {/* Actions */}
                <div className="space-y-3">
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
        {activeTab === 'setup' && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                webhook ? 'Update Webhook' : 'Create Webhook'
              )}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};


