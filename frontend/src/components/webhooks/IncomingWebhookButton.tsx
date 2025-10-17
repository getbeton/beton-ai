/**
 * IncomingWebhookButton
 * 
 * Trigger button for opening the incoming webhook configuration modal.
 * Displays webhook status (active/inactive) in the button.
 * 
 * Features:
 * - Shows webhook icon
 * - Indicates active/inactive state
 * - Opens configuration modal on click
 * 
 * @example
 * <IncomingWebhookButton
 *   tableId={table.id}
 *   tableName={table.name}
 *   columns={table.columns}
 * />
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Webhook } from 'lucide-react';
import { IncomingWebhookModal } from './IncomingWebhookModal';
import { apiClient } from '@/lib/api';
import { IncomingWebhook, TableColumn } from './types';

interface IncomingWebhookButtonProps {
  tableId: string;
  tableName: string;
  columns: TableColumn[];
  autoOpen?: boolean;
}

export const IncomingWebhookButton: React.FC<IncomingWebhookButtonProps> = ({
  tableId,
  tableName,
  columns,
  autoOpen = false,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [webhook, setWebhook] = useState<IncomingWebhook | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch existing webhook configuration
  useEffect(() => {
    const fetchWebhook = async () => {
      try {
        setLoading(true);
        const response = await apiClient.webhooks.getIncoming(tableId);
        if (response.data.success && response.data.data) {
          setWebhook(response.data.data);
        }
      } catch (error: any) {
        // Webhook doesn't exist yet, that's ok
        console.log('[IncomingWebhookButton] No webhook found for table:', tableId);
      } finally {
        setLoading(false);
      }
    };

    fetchWebhook();
  }, [tableId]);

  // Auto-open modal if requested (for incoming webhook setup from empty state)
  useEffect(() => {
    if (autoOpen && !loading) {
      setShowModal(true);
    }
  }, [autoOpen, loading]);

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  const handleWebhookUpdated = (updatedWebhook: IncomingWebhook | null) => {
    setWebhook(updatedWebhook);
  };

  return (
    <>
      <Button
        variant={webhook?.isActive ? 'default' : 'outline'}
        onClick={handleOpenModal}
        disabled={loading}
      >
        <Webhook className="h-4 w-4 mr-2" />
        Incoming Webhook
        {webhook?.isActive && (
          <span className="ml-2 h-2 w-2 rounded-full bg-green-500"></span>
        )}
      </Button>

      <IncomingWebhookModal
        open={showModal}
        onClose={handleCloseModal}
        tableId={tableId}
        tableName={tableName}
        tableColumns={columns}
        existingWebhook={webhook}
        onWebhookUpdated={handleWebhookUpdated}
      />
    </>
  );
};


