'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onFileUpload: (files: File[]) => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onFileUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileUpload(acceptedFiles);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4 sm:p-6">
      <div className="w-full max-w-2xl">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 sm:p-12 text-center cursor-pointer
            transition-all duration-200 ease-in-out
            ${isDragActive && !isDragReject
              ? 'border-blue-500 bg-blue-50'
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} aria-label="Upload CSV file" />
          
          {/* Upload Icon */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-gray-100 flex items-center justify-center">
              {isDragActive ? (
                <FileSpreadsheet className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
              ) : (
                <Upload className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
              )}
            </div>
          </div>

          {/* Main Heading */}
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-4">
            {isDragActive
              ? 'Drop your CSV here to create your first table'
              : 'Drop your CSV here to create your first table'
            }
          </h3>

          {/* Description */}
          <p className="text-gray-600 mb-6 max-w-sm mx-auto">
            Transform your prospect data into organized tables with automatic column detection and data validation.
          </p>

          {/* Call-to-Action Button */}
          <Button 
            type="button"
            size="lg"
            className="mb-4"
            onClick={(e) => {
              e.stopPropagation();
              // Trigger file dialog
              const input = document.querySelector('input[type="file"]') as HTMLInputElement;
              input?.click();
            }}
          >
            <Upload className="mr-2 h-5 w-5" />
            Choose CSV File
          </Button>

          {/* File Guidance */}
          <div className="text-sm text-gray-500 space-y-1">
            <p>Supports CSV files up to 50MB</p>
            <p className="text-xs">Automatic column detection • Data validation included</p>
          </div>

          {/* Drag States Feedback */}
          {isDragReject && (
            <div className="mt-4 text-red-600 text-sm">
              Please upload a valid CSV file only
            </div>
          )}
        </div>

        {/* Additional Features Preview */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div className="p-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2">
              <FileSpreadsheet className="h-4 w-4 text-blue-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Smart Detection</h4>
            <p className="text-xs text-gray-600">Automatic column type detection and validation</p>
          </div>
          
          <div className="p-4">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
              <Upload className="h-4 w-4 text-green-600" />
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Fast Upload</h4>
            <p className="text-xs text-gray-600">Progress tracking with real-time updates</p>
          </div>
          
          <div className="p-4">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-2">
              <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h4 className="font-medium text-gray-900 mb-1">Ready to Use</h4>
            <p className="text-xs text-gray-600">Instantly searchable and manageable data</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptyState;
