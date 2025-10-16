/**
 * WebhookDeliveryLog
 * 
 * Display delivery history for outbound webhooks.
 * Shows status, response times, and retry attempts.
 * 
 * Features:
 * - Table view of recent deliveries
 * - Status indicators with badges
 * - Response time metrics
 * - Expandable error details
 * - Pagination support
 * 
 * @example
 * <WebhookDeliveryLog
 *   webhookId={webhook.id}
 *   deliveries={deliveries}
 *   loading={isLoading}
 * />
 */

'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AlertCircle, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { WebhookDelivery } from './types';

interface WebhookDeliveryLogProps {
  webhookId: string;
  deliveries: WebhookDelivery[];
  loading: boolean;
}

export const WebhookDeliveryLog: React.FC<WebhookDeliveryLogProps> = ({
  deliveries,
  loading,
}) => {
  const [expandedDeliveryId, setExpandedDeliveryId] = useState<string | null>(null);

  // Format date/time
  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Toggle expanded view
  const toggleExpanded = (deliveryId: string) => {
    setExpandedDeliveryId(expandedDeliveryId === deliveryId ? null : deliveryId);
  };

  // Get status badge variant
  const getStatusBadge = (success: boolean, statusCode: number | null) => {
    if (success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <Check className="h-3 w-3 mr-1" />
          Success
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <X className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    }
  };

  // Get event badge
  const getEventBadge = (event: string) => {
    const colors = {
      'row.created': 'bg-blue-100 text-blue-800',
      'row.updated': 'bg-yellow-100 text-yellow-800',
      'row.deleted': 'bg-red-100 text-red-800',
    };

    return (
      <Badge variant="outline" className={colors[event as keyof typeof colors] || ''}>
        {event}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-sm text-muted-foreground">Loading delivery history...</div>
      </div>
    );
  }

  if (deliveries.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No deliveries yet. Create a row to trigger the webhook.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop: Table View */}
      <div className="hidden md:block border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Response Time</TableHead>
              <TableHead>Attempt</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deliveries.map((delivery) => (
              <React.Fragment key={delivery.id}>
                <TableRow>
                  <TableCell className="font-medium">
                    {formatDateTime(delivery.createdAt)}
                  </TableCell>
                  <TableCell>{getEventBadge(delivery.event)}</TableCell>
                  <TableCell>{getStatusBadge(delivery.success, delivery.statusCode)}</TableCell>
                  <TableCell>
                    {delivery.responseTime ? `${delivery.responseTime}ms` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{delivery.attempt}</Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(delivery.id)}
                    >
                      {expandedDeliveryId === delivery.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Details */}
                {expandedDeliveryId === delivery.id && (
                  <TableRow>
                    <TableCell colSpan={6} className="bg-muted/50">
                      <div className="py-3 space-y-3">
                        {/* Payload */}
                        <div>
                          <p className="text-xs font-medium mb-1">Payload:</p>
                          <pre className="p-2 bg-background rounded text-xs font-mono overflow-x-auto max-h-[200px]">
                            {JSON.stringify(delivery.payload, null, 2)}
                          </pre>
                        </div>

                        {/* Response */}
                        {delivery.responseBody && (
                          <div>
                            <p className="text-xs font-medium mb-1">Response:</p>
                            <pre className="p-2 bg-background rounded text-xs font-mono overflow-x-auto max-h-[200px]">
                              {delivery.responseBody}
                            </pre>
                          </div>
                        )}

                        {/* Error */}
                        {delivery.error && (
                          <div>
                            <p className="text-xs font-medium mb-1 text-destructive">Error:</p>
                            <pre className="p-2 bg-destructive/10 rounded text-xs font-mono overflow-x-auto">
                              {delivery.error}
                            </pre>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: Card View */}
      <div className="md:hidden space-y-3">
        {deliveries.map((delivery) => (
          <Card key={delivery.id}>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {formatDateTime(delivery.createdAt)}
                  </div>
                  {getStatusBadge(delivery.success, delivery.statusCode)}
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Event:</span>
                    {getEventBadge(delivery.event)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Response Time:</span>
                    <span>{delivery.responseTime ? `${delivery.responseTime}ms` : '-'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Attempt:</span>
                    <Badge variant="secondary">{delivery.attempt}</Badge>
                  </div>
                </div>

                {/* Expand Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleExpanded(delivery.id)}
                  className="w-full"
                >
                  {expandedDeliveryId === delivery.id ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Hide Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Show Details
                    </>
                  )}
                </Button>

                {/* Expanded Details */}
                {expandedDeliveryId === delivery.id && (
                  <div className="pt-3 border-t space-y-3">
                    {/* Payload */}
                    <div>
                      <p className="text-xs font-medium mb-1">Payload:</p>
                      <pre className="p-2 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[150px]">
                        {JSON.stringify(delivery.payload, null, 2)}
                      </pre>
                    </div>

                    {/* Response */}
                    {delivery.responseBody && (
                      <div>
                        <p className="text-xs font-medium mb-1">Response:</p>
                        <pre className="p-2 bg-muted rounded text-xs font-mono overflow-x-auto max-h-[150px]">
                          {delivery.responseBody}
                        </pre>
                      </div>
                    )}

                    {/* Error */}
                    {delivery.error && (
                      <div>
                        <p className="text-xs font-medium mb-1 text-destructive">Error:</p>
                        <pre className="p-2 bg-destructive/10 rounded text-xs font-mono overflow-x-auto">
                          {delivery.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};


