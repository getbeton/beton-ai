'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Download, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  StopCircle,
  ExternalLink
} from 'lucide-react';
import { BulkDownloadJobInfo } from '@/types/bulkDownload';

interface JobProgressCardProps {
  job: BulkDownloadJobInfo;
  onCancel?: (jobId: string) => void;
  onViewTable?: (jobId: string) => void;
}

export const JobProgressCard: React.FC<JobProgressCardProps> = ({
  job,
  onCancel,
  onViewTable
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      case 'running':
        return 'bg-blue-500';
      case 'pending':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      case 'cancelled':
        return <StopCircle className="h-4 w-4" />;
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const canCancel = job.status === 'pending' || job.status === 'running';
  const canViewTable = job.status === 'completed';

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Download Job
          </CardTitle>
          <Badge className={`${getStatusColor(job.status)} text-white`}>
            <span className="flex items-center gap-1">
              {getStatusIcon(job.status)}
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(job.status === 'running' || job.status === 'completed') && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{job.progress.percentage}%</span>
            </div>
            <Progress value={job.progress.percentage} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {job.progress.processedRecords.toLocaleString()} of {job.progress.totalEstimated.toLocaleString()} records
              </span>
              <span>
                Page {job.progress.currentPage} of {job.progress.totalPages}
              </span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {job.status === 'failed' && job.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">
              <strong>Error:</strong> {job.error}
            </p>
          </div>
        )}

        {/* Job Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Started:</span>
            <p className="font-medium">
              {job.startedAt ? formatDate(job.startedAt) : 'Not started'}
            </p>
          </div>
          
          {job.completedAt && (
            <div>
              <span className="text-gray-500">Completed:</span>
              <p className="font-medium">{formatDate(job.completedAt)}</p>
            </div>
          )}
          
          <div>
            <span className="text-gray-500">Created:</span>
            <p className="font-medium">{formatDate(job.createdAt)}</p>
          </div>
          
          <div>
            <span className="text-gray-500">Job ID:</span>
            <p className="font-mono text-xs">{job.id}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel?.(job.id)}
              className="flex items-center gap-2"
            >
              <StopCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
          
          {canViewTable && (
            <Button
              size="sm"
              onClick={() => onViewTable?.(job.id)}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              View Table
            </Button>
          )}
        </div>

        {/* Status Messages */}
        {job.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <p className="text-sm text-yellow-700">
              Job is queued and will start processing shortly...
            </p>
          </div>
        )}

        {job.status === 'running' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-700">
              Download is in progress. You can safely navigate away from this page.
            </p>
          </div>
        )}

        {job.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <p className="text-sm text-green-700">
              ✅ Download completed successfully! {job.progress.processedRecords.toLocaleString()} records saved.
            </p>
          </div>
        )}

        {job.status === 'cancelled' && (
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
            <p className="text-sm text-gray-700">
              Job was cancelled. Partial data may have been saved.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 