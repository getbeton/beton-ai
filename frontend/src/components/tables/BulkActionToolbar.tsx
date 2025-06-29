'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  visible?: boolean;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onBulkDelete,
  onBulkExport,
  visible = false
}) => {
  return (
    <AnimatePresence>
      {visible && selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-blue-600 text-white rounded-lg shadow-lg px-4 py-3 flex items-center space-x-4 min-w-[300px] max-w-[90vw]"
        >
          {/* Selection Count */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {selectedCount} table{selectedCount > 1 ? 's' : ''} selected
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-auto">
            {/* Export Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkExport}
              className="text-white hover:bg-blue-700 hover:text-white h-8 px-3"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export</span>
            </Button>

            {/* Delete Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              className="text-white hover:bg-red-600 hover:text-white h-8 px-3"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Delete</span>
            </Button>

            {/* Clear Selection Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              className="text-white hover:bg-blue-700 hover:text-white h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionToolbar; 