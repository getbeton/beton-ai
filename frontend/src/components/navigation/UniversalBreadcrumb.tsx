"use client";

import { usePathname } from "next/navigation";
import { TableIcon, Database } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface UniversalBreadcrumbProps {
  tableName?: string;
  stats?: {
    columns: number;
    totalRows: number;
  };
}

/**
 * UniversalBreadcrumb Component
 * 
 * Provides breadcrumb navigation for all dashboard pages.
 * Automatically determines the breadcrumb path based on the current URL.
 * 
 * @param tableName - Optional table name for table detail pages
 * @param stats - Optional table statistics (columns and rows count) displayed on the right
 */
export function UniversalBreadcrumb({ tableName, stats }: UniversalBreadcrumbProps) {
  const pathname = usePathname();

  // Determine if we're on a table detail page
  const isTableDetailPage = pathname?.includes('/dashboard/tables/');
  const isIntegrationsPage = pathname?.includes('/dashboard/integrations');
  const isTablesListPage = pathname === '/dashboard' || pathname === '/dashboard/tables';

  return (
    <div className="flex items-center justify-between">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          
          {isTableDetailPage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">Tables</BreadcrumbLink>
              </BreadcrumbItem>
              {tableName && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <div className="flex items-center gap-2 text-foreground">
                      <TableIcon size={16} aria-hidden="true" />
                      <span>{tableName}</span>
                    </div>
                  </BreadcrumbItem>
                </>
              )}
            </>
          )}
          
          {isIntegrationsPage && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-foreground">Integrations</span>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
      
      {/* Table Statistics - displayed on the right side of breadcrumbs */}
      {stats && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-foreground">{stats.columns}</span>
            <span>Columns</span>
          </div>
          <div className="flex items-center gap-2">
            <TableIcon className="h-4 w-4" aria-hidden="true" />
            <span className="font-medium text-foreground">{stats.totalRows}</span>
            <span>Total Rows</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversalBreadcrumb;

