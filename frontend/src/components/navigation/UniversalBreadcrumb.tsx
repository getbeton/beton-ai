"use client";

import { usePathname } from "next/navigation";
import { TableIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface UniversalBreadcrumbProps {
  tableName?: string;
}

/**
 * UniversalBreadcrumb Component
 * 
 * Provides breadcrumb navigation for all dashboard pages.
 * Automatically determines the breadcrumb path based on the current URL.
 * 
 * @param tableName - Optional table name for table detail pages
 */
export function UniversalBreadcrumb({ tableName }: UniversalBreadcrumbProps) {
  const pathname = usePathname();

  // Determine if we're on a table detail page
  const isTableDetailPage = pathname?.includes('/dashboard/tables/');
  const isIntegrationsPage = pathname?.includes('/dashboard/integrations');
  const isTablesListPage = pathname === '/dashboard' || pathname === '/dashboard/tables';

  return (
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
  );
}

export default UniversalBreadcrumb;

