import axios from 'axios';
import { supabase } from './supabase';
import {
  BulkDownloadEstimate,
  BulkDownloadJobInfo,
  BulkDownloadJobsResponse,
  BulkDownloadStartRequest,
  BulkDownloadEstimateRequest
} from '../types/bulkDownload';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/bulk-download`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests using Supabase session
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const bulkDownloadApi = {
  /**
   * Get estimate for bulk download
   */
  async getEstimate(request: BulkDownloadEstimateRequest): Promise<BulkDownloadEstimate> {
    const response = await api.post('/estimate', request);
    return response.data.data;
  },

  /**
   * Start a bulk download job
   */
  async startDownload(request: BulkDownloadStartRequest): Promise<{ jobId: string }> {
    const response = await api.post('/start', request);
    return response.data.data;
  },

  /**
   * Get job status and progress
   */
  async getJobInfo(jobId: string): Promise<BulkDownloadJobInfo> {
    const response = await api.get(`/job/${jobId}`);
    return response.data.data;
  },

  /**
   * Cancel a bulk download job
   */
  async cancelJob(jobId: string): Promise<void> {
    await api.post(`/job/${jobId}/cancel`);
  },

  /**
   * Get user's bulk download jobs
   */
  async getUserJobs(): Promise<BulkDownloadJobsResponse> {
    const response = await api.get('/jobs');
    return response.data.data;
  },
}; 