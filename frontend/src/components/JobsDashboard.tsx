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
  Bot,
  Calendar,
  Timer
} from 'lucide-react';
import { BulkDownloadJobInfo } from '@/types/bulkDownload';
import { bulkDownloadApi } from '@/lib/bulkDownloadApi';
import { aiTaskApi, AiTaskJob } from '@/lib/api';
import { useWebSocket } from '@/hooks/useWebSocket';
import { supabase } from '@/lib/supabase';

interface JobsDashboardProps {
  onJobSelect?: (jobId: string) => void;
}

// Unified job interface
interface UnifiedJob {
  id: string;
  type: 'bulk_download' | 'ai_task';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  timeAgo?: string;
  duration?: number;
  
  // Bulk download specific
  tableName?: string;
  processedRecords?: number;
  totalEstimated?: number;
  
  // AI task specific
  columnName?: string;
  executionScope?: string;
  totalTasks?: number;
  completedTasks?: number;
  failedTasks?: number;
}

export const JobsDashboard: React.FC<JobsDashboardProps> = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState<UnifiedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getCurrentUser();
  }, []);

  // WebSocket handlers
  const handleJobProgress = React.useCallback((jobInfo: any) => {
    console.log('Job progress:', jobInfo);
    fetchJobs(); // Simple refresh for now
  }, []);

  const handleJobComplete = React.useCallback((jobInfo: any) => {
    console.log('Job complete:', jobInfo);
    fetchJobs(); // Refresh when job completes
  }, []);

  const handleJobFailed = React.useCallback((jobInfo: any) => {
    console.log('Job failed:', jobInfo);
    fetchJobs(); // Refresh when job fails
  }, []);

  // WebSocket connection
  useWebSocket({
    userId: user?.id,
    onJobProgress: handleJobProgress,
    onJobComplete: handleJobComplete,
    onJobFailed: handleJobFailed
  });

  const getTimeAgo = (date: string): string => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch both types of jobs
      const [bulkDownloadResponse, aiTaskResponse] = await Promise.all([
        bulkDownloadApi.getUserJobs().catch(() => ({ all: [] })),
        aiTaskApi.getJobs().catch(() => ({ data: { success: true, data: [] } }))
      ]);

      // Convert bulk download jobs
      const bulkDownloadJobs: UnifiedJob[] = (bulkDownloadResponse?.all || []).map((job: BulkDownloadJobInfo) => ({
        id: job.id,
        type: 'bulk_download' as const,
        status: job.status,
        progress: job.progress?.percentage || 0,
        createdAt: job.createdAt.toString(),
        startedAt: job.startedAt?.toString(),
        completedAt: job.completedAt?.toString(),
        tableName: `${job.progress?.processedRecords || 0} records`,
        processedRecords: job.progress?.processedRecords || 0,
        totalEstimated: job.progress?.totalEstimated || 0,
        timeAgo: getTimeAgo(job.createdAt.toString()),
        duration: job.completedAt && job.startedAt 
          ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
          : undefined
      }));

      // Convert AI task jobs
      const aiTaskJobs: UnifiedJob[] = (aiTaskResponse?.data?.data || []).map((job: AiTaskJob) => ({
        id: job.id,
        type: 'ai_task' as const,
        status: job.status,
        progress: job.progress || 0,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
        tableName: job.tableName,
        columnName: job.columnName,
        executionScope: job.executionScope,
        totalTasks: job.totalTasks,
        completedTasks: job.completedTasks,
        failedTasks: job.failedTasks,
        timeAgo: getTimeAgo(job.createdAt),
        duration: job.completedAt && job.startedAt 
          ? new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()
          : undefined
      }));

      // Combine and sort all jobs
      const allJobs = [...bulkDownloadJobs, ...aiTaskJobs].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setJobs(allJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchJobs();
      // Refresh every 30 seconds
      const interval = setInterval(fetchJobs, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const JobCard = ({ job }: { job: UnifiedJob }) => (
    <Card key={job.id} className="mb-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onJobSelect?.(job.id)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {job.type === 'ai_task' ? (
              <Bot className="h-5 w-5 text-purple-600" />
            ) : (
              <Download className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <h3 className="font-medium text-sm">
                {job.type === 'ai_task' ? (
                  <>AI Task: {job.columnName} ({job.executionScope})</>
                ) : (
                  <>Bulk Download: {job.tableName}</>
                )}
              </h3>
              <p className="text-xs text-muted-foreground">
                {job.type === 'ai_task' ? (
                  `${job.completedTasks || 0}/${job.totalTasks || 0} tasks`
                ) : (
                  `${job.processedRecords || 0}/${job.totalEstimated || 0} records`
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={
              job.status === 'completed' ? 'default' :
              job.status === 'failed' ? 'destructive' :
              job.status === 'running' ? 'secondary' :
              'outline'
            }>
              {job.status === 'running' && <PlayCircle className="w-3 h-3 mr-1" />}
              {job.status === 'completed' && <CheckCircle className="w-3 h-3 mr-1" />}
              {job.status === 'failed' && <XCircle className="w-3 h-3 mr-1" />}
              {job.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
              {job.status}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.round(job.progress)}%</span>
          </div>
          <Progress value={job.progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{job.timeAgo}</span>
          </div>
          {job.duration && (
            <div className="flex items-center gap-1">
              <Timer className="w-3 h-3" />
              <span>{Math.round(job.duration / 1000)}s</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading jobs...</p>
        </div>
      </div>
    );
  }

  const runningJobs = jobs.filter(j => j.status === 'running' || j.status === 'pending');
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Running</CardTitle>
            <PlayCircle className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedJobs.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{failedJobs.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Jobs ({jobs.length})</TabsTrigger>
          <TabsTrigger value="running">Running ({runningJobs.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedJobs.length})</TabsTrigger>
          <TabsTrigger value="failed">Failed ({failedJobs.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          {jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No jobs found</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="running" className="mt-6">
          {runningJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No running jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {runningJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          {completedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No completed jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="failed" className="mt-6">
          {failedJobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No failed jobs</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {failedJobs.map(job => <JobCard key={job.id} job={job} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}; 