'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';
import { supabase } from '@/lib/supabase';
import { Toaster } from 'react-hot-toast';
import TableDashboard from '@/components/TableDashboard';
import FileUploadDropzone from '@/components/upload/FileUploadDropzone';
import MainNavigation from '@/components/navigation/MainNavigation';
import BreadcrumbNavigation from '@/components/navigation/BreadcrumbNavigation';
import { validateCSVFile, generateTableNameFromFile } from '@/lib/utils';
import { apiClient } from '@/lib/api';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          router.push('/auth');
          return;
        }
        setUser(session.user);
      } catch (error) {
        console.error('Error checking user session:', error);
        router.push('/auth');
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: any, session: any) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          router.push('/auth');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);



  // Handle file upload from global dropzone
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    
    // Validate file using utility function
    const validation = validateCSVFile(file);
    if (!validation.valid) {
      toast.error(validation.error!);
      return;
    }

    // Generate table name from filename
    const tableName = generateTableNameFromFile(file.name);

    toast.loading('Uploading CSV file...', { id: 'csv-upload-global' });

    try {
      const response = await apiClient.tables.uploadCSV(file, tableName);
      
      if (response.data.success) {
        toast.success(`CSV uploaded successfully! Creating table "${response.data.data.tableName}"`, { 
          id: 'csv-upload-global' 
        });
        
        // The table will appear in the dashboard when the user navigates back
        // or when the TableDashboard component refreshes its data
      }
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast.error(error.message || 'Failed to upload CSV file', { 
        id: 'csv-upload-global' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <FileUploadDropzone onFileUpload={handleFileUpload}>
      <Head>
        <title>Tables - Beton-AI Dashboard</title>
        <meta name="description" content="Manage your data tables and CSV uploads with Beton-AI's automation platform." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        
        {/* Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <MainNavigation />
            </div>
          </div>
        </header>

        {/* Breadcrumb Navigation */}
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4">
          <BreadcrumbNavigation />
        </div>

        {/* Main Content */}
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 pb-8">
          <TableDashboard />
        </main>
      </div>
    </FileUploadDropzone>
  );
} 