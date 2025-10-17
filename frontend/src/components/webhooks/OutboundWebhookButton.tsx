/**
 * OutboundWebhookButton
 * 
 * Dropdown trigger for outbound webhook configuration and CSV export.
 * Replaces the standalone "Export CSV" button with a dropdown menu.
 * 
 * Features:
 * - Dropdown menu with export and webhook options
 * - Shows webhook count if webhooks exist
 * - Opens configuration modal
 * 
 * @example
 * <OutboundWebhookButton
 *   tableId={table.id}
 *   tableName={table.name}
 *   onExportCSV={handleExportCSV}
 * />
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Send, Settings, ChevronDown } from 'lucide-react';
import { OutboundWebhookModal } from './OutboundWebhookModal';
import { apiClient } from '@/lib/api';
import { OutboundWebhook } from './types';

interface OutboundWebhookButtonProps {
  tableId: string;
  tableName: string;
  onExportCSV: () => void;
}

export const OutboundWebhookButton: React.FC<OutboundWebhookButtonProps> = ({
  tableId,
  tableName,
  onExportCSV,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [webhooks, setWebhooks] = useState<OutboundWebhook[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<OutboundWebhook | null>(null);

  // Fetch existing webhooks
  useEffect(() => {
    const fetchWebhooks = async () => {
      try {
        setLoading(true);
        const response = await apiClient.webhooks.listOutbound(tableId);
        if (response.data.success && response.data.data) {
          setWebhooks(response.data.data);
        }
      } catch (error: any) {
        console.log('[OutboundWebhookButton] Failed to fetch webhooks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebhooks();
  }, [tableId]);

  const handleOpenModal = (webhook?: OutboundWebhook) => {
    setSelectedWebhook(webhook || null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedWebhook(null);
  };

  const handleWebhooksUpdated = async () => {
    // Refresh webhook list
    try {
      const response = await apiClient.webhooks.listOutbound(tableId);
      if (response.data.success && response.data.data) {
        setWebhooks(response.data.data);
      }
    } catch (error: any) {
      console.log('[OutboundWebhookButton] Failed to refresh webhooks:', error);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-1">
            <Download className="h-4 w-4" />
            Export Data
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56" sideOffset={5}>
          {/* CSV Export */}
          <DropdownMenuItem onClick={onExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export as CSV
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Create New Webhook */}
          <DropdownMenuItem onClick={() => handleOpenModal()}>
            <Send className="mr-2 h-4 w-4" />
            Create Outbound Webhook
          </DropdownMenuItem>

          {/* Manage Existing Webhooks */}
          {webhooks.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {webhooks.map((webhook) => (
                <DropdownMenuItem
                  key={webhook.id}
                  onClick={() => handleOpenModal(webhook)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  <span className="flex-1">
                    {new URL(webhook.url).hostname}
                  </span>
                  {webhook.isActive && (
                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  )}
                </DropdownMenuItem>
              ))}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <OutboundWebhookModal
        open={showModal}
        onClose={handleCloseModal}
        tableId={tableId}
        tableName={tableName}
        existingWebhook={selectedWebhook}
        onWebhooksUpdated={handleWebhooksUpdated}
      />
    </>
  );
};


