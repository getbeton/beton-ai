'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Loader2, 
  Download, 
  Clock, 
  Database, 
  CheckCircle, 
  XCircle,
  PlayCircle
} from 'lucide-react';
import { bulkDownloadApi } from '@/lib/bulkDownloadApi';
import { BulkDownloadEstimate, BulkDownloadJobInfo } from '@/types/bulkDownload';
import { useWebSocket } from '@/hooks/useWebSocket';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: any;
  integrationId: string;
  onJobCreated: (jobId: string) => void;
}

export const BulkDownloadModal: React.FC<BulkDownloadModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  integrationId,
  onJobCreated
}) => {
  const [step, setStep] = useState<'estimating' | 'confirm' | 'creating' | 'pending' | 'downloading' | 'completed' | 'failed'>('estimating');
  const [estimate, setEstimate] = useState<BulkDownloadEstimate | null>(null);
  const [tableName, setTableName] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<BulkDownloadJobInfo | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  
  // Use ref for currentJobId to avoid stale closure in WebSocket callbacks
  const currentJobIdRef = useRef<string | null>(null);

  // Get user ID from Supabase session
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    if (isOpen) {
      getUserId();
    }
  }, [isOpen]);

  // Polling fallback for when WebSocket isn't available
  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    
    if (usePolling && currentJobIdRef.current && (step === 'downloading' || step === 'creating')) {
      pollInterval = setInterval(async () => {
        try {
          // You would need to implement a job status endpoint
          console.log('Polling for job progress (WebSocket fallback)');
          // const jobStatus = await bulkDownloadApi.getJobStatus(currentJobIdRef.current);
          // setJobProgress(jobStatus);
        } catch (error) {
          console.error('Error polling job status:', error);
        }
      }, 2000);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [usePolling, currentJobIdRef.current, step]);

  // WebSocket connection for real-time progress (only when we have userId and are downloading)
  const { isConnected, connectionStatus } = useWebSocket({
    userId: userId && (step === 'creating' || step === 'downloading') ? userId : undefined,
    onJobProgress: (jobInfo: BulkDownloadJobInfo) => {
      console.log('🔄 WebSocket onJobProgress called:', {
        receivedJobId: jobInfo.id,
        receivedJobIdType: typeof jobInfo.id,
        currentJobId: currentJobIdRef.current,
        currentJobIdType: typeof currentJobIdRef.current,
        areEqual: jobInfo.id === currentJobIdRef.current,
        jobStatus: jobInfo.status,
        currentStep: step,
        jobProgress: jobInfo.progress
      });
      
      // Use string comparison as fallback to handle type mismatches
      const jobIdMatches = jobInfo.id === currentJobIdRef.current || String(jobInfo.id) === String(currentJobIdRef.current);
      
      if (jobIdMatches) {
        console.log('✅ Job ID matches, updating progress state');
        setJobProgress(jobInfo);
        
        // Transition from creating to downloading when job starts running
        if (jobInfo.status === 'running' && (step === 'creating' || step === 'pending')) {
          console.log('🚀 Transitioning to downloading - job started running');
          setStep('downloading');
        }
        // Handle pending status while job is queued
        else if (jobInfo.status === 'pending' && step === 'creating') {
          console.log('⏳ Job is pending in queue');
          setStep('pending');
        }
        else {
          console.log('⏳ Status or step condition not met:', {
            jobStatus: jobInfo.status,
            currentStep: step,
            shouldTransition: jobInfo.status === 'running' && step === 'creating'
          });
        }
      } else {
        console.log('❌ Job ID mismatch - ignoring update:', {
          received: `"${jobInfo.id}" (${typeof jobInfo.id})`,
          expected: `"${currentJobIdRef.current}" (${typeof currentJobIdRef.current})`,
          stringComparison: String(jobInfo.id) === String(currentJobIdRef.current)
        });
      }
    },
    onJobComplete: (jobInfo: BulkDownloadJobInfo) => {
      console.log('✅ WebSocket onJobComplete called:', jobInfo.id, 'vs', currentJobIdRef.current);
      if (jobInfo.id === currentJobIdRef.current) {
        setJobProgress(jobInfo);
        setStep('completed');
        toast.success('Bulk download completed successfully!');
      }
    },
    onJobFailed: (jobInfo: BulkDownloadJobInfo) => {
      console.log('❌ WebSocket onJobFailed called:', jobInfo.id, 'vs', currentJobIdRef.current);
      if (jobInfo.id === currentJobIdRef.current) {
        setJobProgress(jobInfo);
        setError(jobInfo.error || 'Download failed');
        setStep('failed');
        toast.error('Bulk download failed');
      }
    }
  });

  // Switch to polling if WebSocket fails to connect after download starts
  useEffect(() => {
    if (currentJobIdRef.current && (step === 'creating' || step === 'downloading')) {
      const timeout = setTimeout(() => {
        if (connectionStatus === 'connecting' || connectionStatus === 'error') {
          console.log('WebSocket not available, switching to polling mode');
          setUsePolling(true);
        }
      }, 5000); // Wait 5 seconds for WebSocket to connect

      return () => clearTimeout(timeout);
    }
  }, [currentJobIdRef.current, step, connectionStatus]);

  // Fallback: If stuck in 'creating' state too long, transition to downloading
  useEffect(() => {
    if (step === 'creating' && currentJobIdRef.current) {
      const fallbackTimer = setTimeout(() => {
        console.log('Job has been in creating state for 15 seconds, transitioning to downloading');
        setStep('downloading');
        
        // Set initial progress if we haven't received any updates
        if (!jobProgress && currentJobIdRef.current) {
          setJobProgress({
            id: currentJobIdRef.current,
            status: 'running',
            progress: {
              currentPage: 0,
              totalPages: estimate?.totalPages || 1,
              processedRecords: 0,
              totalEstimated: estimate?.totalRecords || 0,
              percentage: 0
            },
            createdAt: new Date().toISOString(),
            startedAt: new Date().toISOString()
          });
        }
      }, 15000); // 15 seconds fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [step, currentJobIdRef.current, jobProgress, estimate]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('estimating');
      setEstimate(null);
      setTableName('');
      setConfirmed(false);
      setError(null);
      currentJobIdRef.current = null;
      setJobProgress(null);
      loadEstimate();
    }
  }, [isOpen]);

  const loadEstimate = async () => {
    try {
      setError(null);
      const estimateResult = await bulkDownloadApi.getEstimate({
        searchQuery,
        integrationId
      });
      setEstimate(estimateResult);
      setStep('confirm');
      
      // Generate a default table name
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      setTableName(`Apollo Search ${timestamp}`);
    } catch (err: any) {
      console.error('Failed to get estimate:', err);
      setError(err.response?.data?.error || 'Failed to estimate download size');
      setStep('confirm'); // Still show the form, but with error
    }
  };

  const handleStartDownload = async () => {
    if (!tableName.trim()) {
      toast.error('Please enter a table name');
      return;
    }

    if (estimate?.exceedsWarningThreshold && !confirmed) {
      toast.error('Please confirm that you want to download this large dataset');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      const result = await bulkDownloadApi.startDownload({
        tableName: tableName.trim(),
        searchQuery,
        integrationId
      });

      currentJobIdRef.current = result.jobId;
      onJobCreated(result.jobId);
      
      // Job is now being processed in the background
      // Real progress updates will come via WebSocket
      console.log(`🚀 Bulk download job ${result.jobId} started. Current state:`, {
        step: 'creating',
        jobId: result.jobId,
        refValue: currentJobIdRef.current,
        userId: userId,
        wsConnected: isConnected,
        wsStatus: connectionStatus
      });
      console.log('Waiting for real progress updates...');

    } catch (err: any) {
      console.error('Failed to start download:', err);
      setError(err.response?.data?.error || 'Failed to start bulk download');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    if (step === 'creating' || step === 'downloading') {
      // Ask for confirmation before closing during download
      if (window.confirm('Download is in progress. Are you sure you want to close? The download will continue in the background.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleCompleteClose = () => {
    onClose();
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getElapsedTime = () => {
    if (!jobProgress?.startedAt) return '0s';
    const start = new Date(jobProgress.startedAt).getTime();
    const now = Date.now();
    return formatDuration(Math.floor((now - start) / 1000));
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'completed' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : step === 'failed' ? (
              <XCircle className="h-5 w-5 text-red-600" />
            ) : step === 'downloading' ? (
              <PlayCircle className="h-5 w-5 text-blue-600" />
            ) : (
              <Database className="h-5 w-5" />
            )}
            {step === 'completed' ? 'Download Complete' : 
             step === 'failed' ? 'Download Failed' :
             step === 'downloading' ? 'Downloading...' :
             'Bulk Download to Table'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'estimating' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Estimating download size...</p>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {estimate && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-gray-900">Download Estimate</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Total Records:</span>
                      <span className="font-medium">{estimate.totalRecords.toLocaleString()}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-600">Est. Duration:</span>
                      <span className="font-medium">{estimate.estimatedDuration}</span>
                    </div>
                  </div>

                  {estimate.exceedsWarningThreshold && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Large Dataset Warning:</strong> This download contains {estimate.totalRecords.toLocaleString()} records. 
                        Consider narrowing your search filters to reduce the dataset size for faster processing.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="tableName">Table Name</Label>
                <Input
                  id="tableName"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="Enter a name for your table"
                />
              </div>

              {estimate?.exceedsWarningThreshold && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirm"
                    checked={confirmed}
                    onCheckedChange={(checked) => setConfirmed(checked as boolean)}
                  />
                  <Label htmlFor="confirm" className="text-sm">
                    I understand this is a large dataset and want to proceed with the download
                  </Label>
                </div>
              )}
            </>
          )}

          {step === 'creating' && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Starting bulk download...</p>
                <p className="text-xs text-gray-500 mt-1">
                  {usePolling ? 'Using polling mode' : `WebSocket: ${connectionStatus}`}
                </p>
                {connectionStatus === 'connecting' && !usePolling && (
                  <p className="text-xs text-gray-400 mt-1">
                    Will switch to polling if WebSocket fails...
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'downloading' && jobProgress && (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-blue-900">Download Progress</h4>
                  <span className="text-sm text-blue-600 font-medium">
                    {jobProgress.progress.percentage.toFixed(1)}%
                  </span>
                </div>
                
                <Progress 
                  value={jobProgress.progress.percentage} 
                  className="h-3"
                />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Records:</span>
                    <span className="font-medium ml-1">
                      {jobProgress.progress.processedRecords.toLocaleString()} / {jobProgress.progress.totalEstimated.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Pages:</span>
                    <span className="font-medium ml-1">
                      {jobProgress.progress.currentPage} / {jobProgress.progress.totalPages}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Elapsed:</span>
                    <span className="font-medium ml-1">{getElapsedTime()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium ml-1 capitalize">{jobProgress.status}</span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                <p><strong>Note:</strong> You can safely close this window. The download will continue in the background and you can monitor progress from your Jobs dashboard.</p>
                {!isConnected && usePolling && (
                  <p className="mt-2 text-yellow-600"><strong>WebSocket unavailable:</strong> Progress updates may be delayed. Check the Jobs dashboard for real-time status.</p>
                )}
              </div>
            </div>
          )}

          {step === 'completed' && jobProgress && (
            <div className="space-y-4">
              <div className="bg-green-50 rounded-lg p-4 space-y-3 text-center">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <h4 className="font-medium text-green-900">Download Completed Successfully!</h4>
                <p className="text-sm text-green-700">
                  Downloaded {jobProgress.progress.processedRecords.toLocaleString()} records to table "<strong>{tableName}</strong>"
                </p>
                <div className="text-xs text-green-600">
                  <p>Total time: {jobProgress.completedAt && jobProgress.startedAt ? 
                    formatDuration(Math.floor((new Date(jobProgress.completedAt).getTime() - new Date(jobProgress.startedAt).getTime()) / 1000)) : 
                    'Unknown'}</p>
                </div>
              </div>
            </div>
          )}

          {step === 'failed' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Download Failed:</strong> {error}
                </AlertDescription>
              </Alert>
              
              {jobProgress && (
                <div className="bg-red-50 rounded-lg p-4 text-sm">
                  <p className="text-red-700">
                    Progress before failure: {jobProgress.progress.processedRecords.toLocaleString()} / {jobProgress.progress.totalEstimated.toLocaleString()} records
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          {step === 'completed' || step === 'failed' ? (
            <Button onClick={handleCompleteClose}>
              Close
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={step === 'creating'}
              >
                {step === 'downloading' ? 'Close (Continue in Background)' : 'Cancel'}
              </Button>
              
              {step === 'confirm' && (
                <Button
                  onClick={handleStartDownload}
                  disabled={!tableName.trim()}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Start Download
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 