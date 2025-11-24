'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { apiClient } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import DashboardShell from '@/components/layout/DashboardShell';
import TablesPageAdapter, { type TablesPageAdapterMethods } from '@/components/dashboard/TablesPageAdapter';
import { EmptyState } from '@/components/EmptyState';
import { CsvUploadModal } from '@/components/upload/CsvUploadModal';
import { FileUploadDropzone } from '@/components/upload/FileUploadDropzone';
import { validateCSVFile, generateTableNameFromFile, generateUniqueTableName } from '@/lib/utils';


/**
 * Dashboard Page - Primary Entry Point
 * 
 * Main dashboard showing tables list with advanced filtering and management.
 * Consolidated from /dashboard/tables to /dashboard for simpler navigation.
 * 
 * Features:
 * - Advanced table view with filtering, sorting, pagination
 * - CSV upload with drag & drop
 * - Create table from templates or custom schema
 * - Apollo search integration
 * - Empty state for first-time users
 */
export default function DashboardPage() {
  const router = useRouter();

  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // CSV upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Empty state flag (no tables exist)
  const [hasNoTables, setHasNoTables] = useState(true);

  // Reference to adapter methods for external control
  const adapterMethodsRef = useRef<TablesPageAdapterMethods | null>(null);

  /**
   * Effect: Track component mount state to prevent modal auto-opening
   */
  useEffect(() => {
    setMounted(true);
    setShowUploadModal(false);
    return () => setMounted(false);
  }, []);

  /**
   * Effect: Check user authentication on mount
   */
  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);

        // Check if user has any tables
        const response = await apiClient.tables.list();
        if (response.data.success) {
          const tableCount = response.data.data.length;
          console.info('[DashboardPage] Initial table count:', tableCount);
          setHasNoTables(tableCount === 0);
        }
      } catch (error) {
        console.error('[DashboardPage] Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [router]);

  /**
   * Handler: Trigger CSV import modal
   */
  const handleImportCSV = useCallback(() => {
    console.info('[DashboardPage] CSV import triggered, mounted:', mounted);
    if (mounted) {
      setShowUploadModal(true);
    }
  }, [mounted]);

  /**
   * Handler: Navigate to Apollo search
   * Updated to return to /dashboard instead of /dashboard/tables
   */
  const handleSearchApollo = useCallback(() => {
    console.info('[DashboardPage] Apollo search triggered');
    router.push('/dashboard/apollo-search?returnTo=/dashboard');
  }, [router]);

  /**
   * Handler: Connect Webhook (INCOMING) - Create table and open webhook modal
   */
  const handleConnectWebhook = useCallback(async () => {
    try {
      console.log('[DashboardPage] Starting webhook table creation...');
      toast.loading('Creating webhook table...', { id: 'webhook-create' });

      // Generate unique table name with timestamp
      const timestamp = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      const tableName = `Webhook Table (${timestamp})`;

      // Create new empty table for INCOMING webhook data
      const response = await apiClient.tables.create({
        name: tableName,
        description: 'Table for incoming webhook data',
        sourceType: 'manual',
        columns: []
      });

      console.log('[DashboardPage] Table creation response:', response.data);

      if (response.data.success) {
        const tableId = response.data.data.id;
        console.log('[DashboardPage] Table created successfully:', tableId);
        toast.success('Table created!', { id: 'webhook-create' });

        // Navigate to table page with flag to open INCOMING webhook modal
        router.push(`/dashboard/tables/${tableId}?openIncomingWebhook=true`);
      } else {
        throw new Error('Table creation failed - no success flag');
      }
    } catch (error: any) {
      console.error('[DashboardPage] Error creating webhook table:', error);
      console.error('[DashboardPage] Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.error || error.message || 'Failed to create table', {
        id: 'webhook-create',
        duration: 5000
      });
    }
  }, [router]);

  /**
   * Handler: CSV file upload
   * 
   * Validates file, uploads to API, and updates table list
   */
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    console.info('[DashboardPage] CSV file upload started:', file.name);

    // Validate file
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    try {
      // Fetch existing tables to check for name collisions
      const tablesResponse = await apiClient.tables.list();
      const existingTables = tablesResponse.data.success ? tablesResponse.data.data : [];

      // Generate base name from filename
      const baseName = generateTableNameFromFile(file.name);

      // Generate unique name with [n] suffix if needed
      const uniqueTableName = generateUniqueTableName(baseName, existingTables);

      console.info('[DashboardPage] Generated unique table name:', { baseName, uniqueTableName });

      toast.loading(`Uploading ${file.name}...`, { id: 'csv-upload' });

      // Upload CSV to API with unique name
      const response = await apiClient.tables.uploadCSV(file, uniqueTableName);

      if (response.data.success) {
        const tableId = response.data.data.tableId;
        const tableName = response.data.data.tableName || uniqueTableName;

        // Close upload modal immediately
        setShowUploadModal(false);

        // Show success toast
        toast.success(`Table "${tableName}" created successfully!`, {
          id: 'csv-upload',
          duration: 3000
        });

        // Redirect to new table page
        router.push(`/dashboard/tables/${tableId}`);

        // Update empty state (though we're navigating away)
        setHasNoTables(false);
      }
    } catch (error: any) {
      console.error('[DashboardPage] CSV upload failed:', error);
      toast.error(error.response?.data?.error || 'Failed to upload CSV', { id: 'csv-upload' });
    }
  };

  /**
   * Callback: Store adapter methods reference
   */
  const handleAdapterReady = useCallback((methods: TablesPageAdapterMethods) => {
    console.info('[DashboardPage] Adapter methods ready');
    adapterMethodsRef.current = methods;
  }, []);

  /**
   * Callback: Handle table count changes from adapter
   * This ensures empty state appears when last table is deleted
   */
  const handleTableCountChange = useCallback((count: number) => {
    console.info('[DashboardPage] Table count changed:', count);
    setHasNoTables(count === 0);
  }, []);

  // Render loading state during authentication check and initial data fetch
  if (loading) {
    return (
      <DashboardShell>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <Toaster position="top-right" />

      {/* CSV Upload Modal */}
      <CsvUploadModal
        open={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadFiles={handleFileUpload}
      />

      {/* Main Content with Drag & Drop Support */}
      <FileUploadDropzone onFileUpload={handleFileUpload}>
        {hasNoTables ? (
          // Show empty state for new users
          <EmptyState
            onImportCSV={handleImportCSV}
            onSearchApollo={handleSearchApollo}
            onConnectWebhook={handleConnectWebhook}
          />
        ) : (
          // Show advanced table view
          <TablesPageAdapter
            userEmail={user?.email}
            onImportCSV={handleImportCSV}
            onSearchApollo={handleSearchApollo}
            initialLoading={false}
            onAdapterReady={handleAdapterReady}
            onTableCountChange={handleTableCountChange}
          />
        )}
      </FileUploadDropzone>
    </DashboardShell>
  );
}
