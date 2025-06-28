'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  Download, 
  CheckCircle, 
  XCircle, 
  PlayCircle, 
  PauseCircle,
  Database,
  Calendar,
  Timer,
  Users,
  AlertCircle
} from 'lucide-react';
import { BulkDownloadJobInfo, BulkDownloadJobsResponse } from '@/types/bulkDownload';
import { bulkDownloadApi } from '@/lib/bulkDownloadApi';
import { useWebSocket } from '@/hooks/useWebSocket';
import { supabase } from '@/lib/supabase';

interface JobsDashboardProps {
  onJobSelect?: (jobId: string) => void;
}

interface JobsData {
  all: (BulkDownloadJobInfo & { timeAgo?: string; duration?: number | undefined })[];
  byStatus: {
    running: BulkDownloadJobInfo[];
    completed: BulkDownloadJobInfo[];
    failed: BulkDownloadJobInfo[];
    cancelled: BulkDownloadJobInfo[];
  };
  summary: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    cancelled: number;
  };
}

export const JobsDashboard: React.FC<JobsDashboardProps> = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState<JobsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Get user ID
  useEffect(() => {
    const getUserId = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    getUserId();
  }, []);

  // Memoize WebSocket callbacks to prevent reconnections
  const handleJobProgress = React.useCallback((jobInfo: BulkDownloadJobInfo) => {
    updateJobInState(jobInfo);
  }, []);

  const handleJobComplete = React.useCallback((jobInfo: BulkDownloadJobInfo) => {
    updateJobInState(jobInfo);
    fetchJobs(); // Refresh full list when job completes
  }, []);

  const handleJobFailed = React.useCallback((jobInfo: BulkDownloadJobInfo) => {
    updateJobInState(jobInfo);
  }, []);

  // WebSocket for real-time updates - only connect when we have a userId
  useWebSocket({
    userId: userId || undefined,
    onJobProgress: handleJobProgress,
    onJobComplete: handleJobComplete,
    onJobFailed: handleJobFailed
  });

  const updateJobInState = (updatedJob: BulkDownloadJobInfo) => {
    if (!jobs) return;
    
    setJobs(prev => {
      if (!prev) return prev;
      
      const updatedAll = prev.all.map(job => 
        job.id === updatedJob.id ? { ...updatedJob, timeAgo: getTimeAgo(updatedJob.createdAt) } : job
      );
      
      return {
        ...prev,
        all: updatedAll,
        byStatus: categorizeJobs(updatedAll)
      };
    });
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response: BulkDownloadJobsResponse = await bulkDownloadApi.getUserJobs();
      
      console.log('API response:', response); // Debug log
      
      // Handle the structured response format from the API
      let jobsData: JobsData;
      
      if (response && response.all && Array.isArray(response.all)) {
        // API returns structured format: {all: [...], running: [...], completed: [...], failed: [...], summary: {...}}
        const sortedJobs = response.all.sort((a: BulkDownloadJobInfo, b: BulkDownloadJobInfo) => {
          const dateA = new Date(a.createdAt).getTime();
          const dateB = new Date(b.createdAt).getTime();
          return dateB - dateA;
        });
        
        // Add time ago information
        const jobsWithTime = sortedJobs.map((job: BulkDownloadJobInfo) => ({
          ...job,
          timeAgo: getTimeAgo(job.createdAt),
          duration: job.completedAt ? 
            Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000) : 
            undefined
        }));

        jobsData = {
          all: jobsWithTime,
          byStatus: {
            running: response.running || [],
            completed: response.completed || [],
            failed: response.failed || [],
            cancelled: response.cancelled || []
          },
          summary: {
            total: response.summary?.total || 0,
            running: response.summary?.running || 0,
            completed: response.summary?.completed || 0,
            failed: response.summary?.failed || 0,
            cancelled: response.summary?.cancelled || 0
          }
        };
      } else {
        // Fallback for any other response format
        console.error('Unexpected response format:', response);
        jobsData = {
          all: [],
          byStatus: { running: [], completed: [], failed: [], cancelled: [] },
          summary: { total: 0, running: 0, completed: 0, failed: 0, cancelled: 0 }
        };
      }

      setJobs(jobsData);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const categorizeJobs = (allJobs: BulkDownloadJobInfo[]) => ({
    running: allJobs.filter(job => job.status === 'running' || job.status === 'pending'),
    completed: allJobs.filter(job => job.status === 'completed'),
    failed: allJobs.filter(job => job.status === 'failed'),
    cancelled: allJobs.filter(job => job.status === 'cancelled')
  });

  const getSummary = (allJobs: BulkDownloadJobInfo[]) => ({
    total: allJobs.length,
    running: allJobs.filter(job => job.status === 'running' || job.status === 'pending').length,
    completed: allJobs.filter(job => job.status === 'completed').length,
    failed: allJobs.filter(job => job.status === 'failed').length,
    cancelled: allJobs.filter(job => job.status === 'cancelled').length
  });

  const getTimeAgo = (date: Date | string): string => {
    const now = new Date();
    const then = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return then.toLocaleDateString();
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled': return <PauseCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    fetchJobs();
    
    // Refresh jobs every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !jobs) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Loading jobs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchJobs} className="mt-2">Retry</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobs) return null;

  const JobCard = ({ job }: { job: BulkDownloadJobInfo & { timeAgo?: string; duration?: number } }) => (
    <Card key={job.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onJobSelect?.(job.id)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusIcon(job.status)}
              <h3 className="font-medium text-gray-900">Table Creation Job</h3>
              <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Database className="h-4 w-4" />
                <span>{job.progress.processedRecords.toLocaleString()} / {job.progress.totalEstimated.toLocaleString()} records</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{job.timeAgo}</span>
              </div>
              {job.duration && (
                <div className="flex items-center gap-1">
                  <Timer className="h-4 w-4" />
                  <span>{formatDuration(job.duration)}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>Page {job.progress.currentPage} / {job.progress.totalPages}</span>
              </div>
            </div>

            {job.status === 'running' || job.status === 'pending' ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progress</span>
                  <span>{job.progress.percentage.toFixed(1)}%</span>
                </div>
                <Progress value={job.progress.percentage} className="h-2" />
              </div>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{jobs.summary.total}</div>
            <div className="text-sm text-gray-600">Total Jobs</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{jobs.summary.running}</div>
            <div className="text-sm text-gray-600">Running</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{jobs.summary.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{jobs.summary.failed}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{jobs.summary.cancelled}</div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Bulk Download Jobs
            <Button onClick={fetchJobs} size="sm" variant="outline" className="ml-auto">
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({jobs.summary.total})</TabsTrigger>
              <TabsTrigger value="running">Running ({jobs.summary.running})</TabsTrigger>
              <TabsTrigger value="completed">Completed ({jobs.summary.completed})</TabsTrigger>
              <TabsTrigger value="failed">Failed ({jobs.summary.failed})</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled ({jobs.summary.cancelled})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              {jobs.all.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No jobs found. Start a bulk download to see jobs here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.all.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="running" className="mt-4">
              {jobs.byStatus.running.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PlayCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No running jobs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.byStatus.running.map(job => <JobCard key={job.id} job={{...job, timeAgo: getTimeAgo(job.createdAt)}} />)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-4">
              {jobs.byStatus.completed.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No completed jobs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.byStatus.completed.map(job => <JobCard key={job.id} job={{...job, timeAgo: getTimeAgo(job.createdAt)}} />)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="failed" className="mt-4">
              {jobs.byStatus.failed.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No failed jobs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.byStatus.failed.map(job => <JobCard key={job.id} job={{...job, timeAgo: getTimeAgo(job.createdAt)}} />)}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cancelled" className="mt-4">
              {jobs.byStatus.cancelled.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <PauseCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cancelled jobs.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.byStatus.cancelled.map(job => <JobCard key={job.id} job={{...job, timeAgo: getTimeAgo(job.createdAt)}} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}; 