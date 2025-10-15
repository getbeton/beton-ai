/**
 * CSV Upload Modal Component
 * 
 * Modal dialog for uploading CSV files with drag & drop functionality.
 * Built using COSS comp-544 component.
 * 
 * Features:
 * - Drag & drop CSV files
 * - Click to browse files
 * - File validation (size, type)
 * - Error handling
 * - Upload progress
 */

"use client"

import { useCallback, useState } from "react"
import { Upload, FileSpreadsheet, XIcon, AlertCircle } from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface CsvUploadModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Callback when files are ready to upload */
  onUploadFiles: (files: File[]) => void
}

/**
 * CSV Upload Modal
 * 
 * Displays a modal dialog with drag & drop CSV file upload functionality.
 * Validates files and calls onUploadFiles when files are selected.
 */
export function CsvUploadModal({ open, onClose, onUploadFiles }: CsvUploadModalProps) {
  const maxSizeMB = 10
  const maxSize = maxSizeMB * 1024 * 1024 // 10MB max

  const [isUploading, setIsUploading] = useState(false)

  const [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      getInputProps,
      clearFiles,
    },
  ] = useFileUpload({
    accept: ".csv,text/csv,application/vnd.ms-excel",
    maxSize,
    multiple: false, // Single file upload
  })

  /**
   * Handle upload button click
   * Triggers the onUploadFiles callback with selected files
   */
  const handleUpload = useCallback(() => {
    if (files.length === 0) return

    const file = files[0]?.file
    if (file instanceof File) {
      console.info('[CsvUploadModal] Starting upload:', file.name);
      setIsUploading(true)
      onUploadFiles([file])
      
      // Note: Parent component handles closing the modal after upload completes
      // Reset uploading state after a short delay to prevent UI freeze
      setTimeout(() => {
        console.info('[CsvUploadModal] Resetting upload state');
        setIsUploading(false)
      }, 500);
    }
  }, [files, onUploadFiles])

  /**
   * Handle modal close
   * Resets the upload state
   */
  const handleClose = useCallback(() => {
    console.info('[CsvUploadModal] Closing modal, isUploading:', isUploading);
    clearFiles()
    setIsUploading(false)
    onClose()
  }, [isUploading, clearFiles, onClose])

  /**
   * Handle file removal
   */
  const handleRemoveFile = useCallback(() => {
    if (files[0]?.id) {
      removeFile(files[0].id)
    }
  }, [files, removeFile])

  const selectedFile = files[0]

  return (
    <Dialog open={open} onOpenChange={(value) => !value && handleClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Upload className="h-5 w-5" />
            Import CSV File
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Upload a CSV file to create a new table. Maximum file size is {maxSizeMB}MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Drop area */}
          <div className="relative">
            <div
              role="button"
              onClick={openFileDialog}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              data-dragging={isDragging || undefined}
              className="relative flex min-h-52 flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-input p-6 transition-colors hover:bg-accent/50 has-disabled:pointer-events-none has-disabled:opacity-50 has-[input:focus]:border-ring has-[input:focus]:ring-[3px] has-[input:focus]:ring-ring/50 data-[dragging=true]:bg-accent/50 data-[dragging=true]:border-primary"
            >
              <input
                {...getInputProps()}
                className="sr-only"
                aria-label="Upload CSV file"
                disabled={isUploading}
              />
              
              {selectedFile ? (
                // File selected - show file info
                <div className="flex w-full flex-col items-center justify-center gap-3 px-4 py-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-primary/10">
                    <FileSpreadsheet className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {(selectedFile.file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ) : (
                // No file selected - show drop zone
                <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
                  <div
                    className="mb-3 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-background"
                    aria-hidden="true"
                  >
                    <FileSpreadsheet className="h-7 w-7 opacity-60" />
                  </div>
                  <p className="mb-2 text-base font-medium">
                    Drop your CSV file here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Maximum file size: {maxSizeMB}MB
                  </p>
                </div>
              )}
            </div>
            
            {/* Remove button for selected file */}
            {selectedFile && !isUploading && (
              <div className="absolute top-4 right-4">
                <button
                  type="button"
                  className="z-50 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-[color,box-shadow] outline-none hover:bg-black/80 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  onClick={handleRemoveFile}
                  aria-label="Remove file"
                >
                  <XIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Error messages */}
          {errors.length > 0 && (
            <div
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive"
              role="alert"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{errors[0]}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading || errors.length > 0}
            >
              {isUploading ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-pulse" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CsvUploadModal

