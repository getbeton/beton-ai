/**
 * AdvancedTablesViewSkeleton - Loading skeleton for AdvancedTablesView
 * 
 * Provides a loading state that matches the structure of the AdvancedTablesView component
 * for a smooth loading experience.
 */

import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface AdvancedTablesViewSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
}

export default function AdvancedTablesViewSkeleton({ 
  rows = 5 
}: AdvancedTablesViewSkeletonProps) {
  return (
    <div className="space-y-6 pt-6">
      {/* Filters Skeleton */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {/* Search input skeleton */}
          <Skeleton className="h-10 w-60" />
          {/* Source filter skeleton */}
          <Skeleton className="h-10 w-32" />
          {/* Status filter skeleton */}
          <Skeleton className="h-10 w-32" />
          {/* View toggle skeleton */}
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="flex items-center gap-3">
          {/* Action buttons skeleton */}
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="overflow-hidden rounded-md border bg-background">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* Checkbox column */}
              <TableHead style={{ width: '28px' }} className="h-11">
                <Skeleton className="h-4 w-4" />
              </TableHead>
              {/* Name column */}
              <TableHead style={{ width: '220px' }} className="h-11">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              {/* Rows column */}
              <TableHead style={{ width: '100px' }} className="h-11">
                <Skeleton className="h-4 w-12" />
              </TableHead>
              {/* Columns column */}
              <TableHead style={{ width: '100px' }} className="h-11">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              {/* Source column */}
              <TableHead style={{ width: '100px' }} className="h-11">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              {/* Status column */}
              <TableHead style={{ width: '120px' }} className="h-11">
                <Skeleton className="h-4 w-14" />
              </TableHead>
              {/* Last Modified column */}
              <TableHead style={{ width: '140px' }} className="h-11">
                <Skeleton className="h-4 w-24" />
              </TableHead>
              {/* Owner column */}
              <TableHead style={{ width: '180px' }} className="h-11">
                <Skeleton className="h-4 w-16" />
              </TableHead>
              {/* Actions column */}
              <TableHead style={{ width: '60px' }} className="h-11">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Checkbox */}
                <TableCell className="align-middle">
                  <Skeleton className="h-4 w-4" />
                </TableCell>
                {/* Name */}
                <TableCell className="align-middle">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                {/* Rows */}
                <TableCell className="align-middle">
                  <Skeleton className="h-5 w-12 rounded-md" />
                </TableCell>
                {/* Columns */}
                <TableCell className="align-middle">
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                {/* Source */}
                <TableCell className="align-middle">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                {/* Status */}
                <TableCell className="align-middle">
                  <Skeleton className="h-5 w-16 rounded-md" />
                </TableCell>
                {/* Last Modified */}
                <TableCell className="align-middle">
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                {/* Owner */}
                <TableCell className="align-middle">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-6 w-6 rounded-full" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </TableCell>
                {/* Actions */}
                <TableCell className="align-middle last:py-0">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between gap-8">
        {/* Rows per page */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-20" />
        </div>
        {/* Page info */}
        <div className="flex grow justify-end">
          <Skeleton className="h-4 w-32" />
        </div>
        {/* Pagination buttons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>
    </div>
  );
}

export { AdvancedTablesViewSkeleton };

