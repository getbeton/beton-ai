'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  Database, 
  CheckCircle, 
  AlertCircle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface UploadProgress {
  fileName: string;
  progress: number;
  stage: "upload" | "parse" | "create" | "import";
  status: "uploading" | "success" | "error";
  jobId?: string;
  error?: string;
  currentStep?: string;
  tableId?: string;
}

interface UploadProgressOverlayProps {
  progress: UploadProgress;
  onClose: () => void;
  onViewTable?: (tableId: string) => void;
}

export const UploadProgressOverlay: React.FC<UploadProgressOverlayProps> = ({
  progress,
  onClose,
  onViewTable
}) => {
  const stages = [
    { key: "upload", label: "Uploading file", icon: Upload },
    { key: "parse", label: "Parsing CSV", icon: FileText },
    { key: "create", label: "Creating table", icon: Database },
    { key: "import", label: "Importing data", icon: CheckCircle },
  ];

  const currentStageIndex = stages.findIndex(stage => stage.key === progress.stage);

  const getStageStatus = (stageIndex: number) => {
    if (progress.status === 'error') {
      return stageIndex <= currentStageIndex ? 'error' : 'pending';
    }
    if (stageIndex < currentStageIndex) return 'completed';
    if (stageIndex === currentStageIndex) return 'active';
    return 'pending';
  };

  const getStageIcon = (stage: any, stageIndex: number) => {
    const status = getStageStatus(stageIndex);
    const IconComponent = stage.icon;
    
    if (status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    
    return (
      <IconComponent 
        className={`h-5 w-5 ${
          status === 'active' ? 'text-blue-500' : 'text-gray-400'
        }`} 
      />
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {progress.status === 'error' ? 'Upload Failed' : 
               progress.status === 'success' ? 'Upload Complete' :
               'Uploading CSV'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* File name */}
          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-2">File:</p>
            <p className="font-medium text-gray-900 truncate">{progress.fileName}</p>
          </div>

          {/* Progress bar */}
          {progress.status !== 'error' && (
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              {progress.currentStep && (
                <p className="text-xs text-gray-500 mt-2">{progress.currentStep}</p>
              )}
            </div>
          )}

          {/* Stage indicators */}
          <div className="space-y-3 mb-6">
            {stages.map((stage, index) => {
              const status = getStageStatus(index);
              return (
                <motion.div
                  key={stage.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                    status === 'active' ? 'bg-blue-50 border border-blue-200' :
                    status === 'completed' ? 'bg-green-50 border border-green-200' :
                    status === 'error' ? 'bg-red-50 border border-red-200' :
                    'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0">
                    {getStageIcon(stage, index)}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      status === 'active' ? 'text-blue-900' :
                      status === 'completed' ? 'text-green-900' :
                      status === 'error' ? 'text-red-900' :
                      'text-gray-600'
                    }`}>
                      {stage.label}
                    </p>
                  </div>
                  {status === 'active' && progress.status === 'uploading' && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Error state */}
          {progress.status === 'error' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-2">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm font-medium text-red-800">Upload Failed</span>
              </div>
              {progress.error && (
                <p className="text-sm text-red-600">{progress.error}</p>
              )}
            </div>
          )}

          {/* Success state */}
          {progress.status === 'success' && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-sm font-medium text-green-800">
                  Table created successfully!
                </span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end space-x-3">
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Close
            </Button>
            {progress.status === 'success' && progress.tableId && onViewTable && (
              <Button 
                onClick={() => onViewTable(progress.tableId!)}
              >
                View Table
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UploadProgressOverlay;
