'use client';

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet } from 'lucide-react';

interface FileUploadDropzoneProps {
  onFileUpload: (files: File[]) => void;
  children: React.ReactNode;
}

export const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  onFileUpload,
  children,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      console.warn('[FileUploadDropzone] rejected files dropped');
      return;
    }

    if (acceptedFiles.length === 0) return;

    onFileUpload(acceptedFiles);
    setIsDragActive(false);
  }, [onFileUpload]);

  const onDragEnter = useCallback(() => {
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback(() => {
    setIsDragActive(false);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false,
    noClick: true,      // Prevent clicking on the entire dashboard from opening file dialog
    noKeyboard: true,   // Prevent keyboard activation on global dropzone
  });

  return (
    <div {...getRootProps()} className="relative min-h-screen">
      <input {...getInputProps()} />
      
      {/* Main Content */}
      {children}

      {/* Global Drag Overlay */}
      <AnimatePresence>
        {isDragActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 rounded-[28px] border-2 border-dashed border-primary/40 bg-primary/10 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2, delay: 0.1 }}
              className="text-center"
            >
              <div className="mx-auto h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground/90 mb-2">
                Drop CSV file to import
              </h3>
              <p className="text-sm text-muted-foreground">
                Release to start creating a new table from your CSV data
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FileUploadDropzone;
