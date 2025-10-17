"use client";

import { ReactNode } from "react";
import { logComponentRender } from "@/lib/debug";
import { UniversalBreadcrumb } from "@/components/navigation/UniversalBreadcrumb";

interface DashboardShellProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  breadcrumbSegments?: any; // Kept for backward compatibility but not used
  tableName?: string; // For table detail pages
  showBreadcrumb?: boolean; // Whether to show breadcrumbs (default: true)
  tableStats?: {
    columns: number;
    totalRows: number;
  }; // Table statistics to display in breadcrumb
}

/**
 * DashboardShell provides a consistent content wrapper for dashboard pages.
 * 
 * Features:
 * - Consistent content padding and max-width
 * - Responsive spacing that adapts to viewport
 * - Optional page title, description, and actions
 * - Universal breadcrumb navigation
 * 
 * Note: Does NOT wrap in AppShell - that's handled by the dashboard layout.
 * This component only provides content styling.
 */
export function DashboardShell({
  title,
  description,
  actions,
  children,
  tableName,
  showBreadcrumb = true,
  tableStats,
}: DashboardShellProps) {
  logComponentRender("DashboardShell", {
    hasTitle: Boolean(title),
    hasDescription: Boolean(description),
  });

  return (
    <div className="w-full p-4 lg:p-6 xl:p-8 bg-muted/30 min-h-screen">
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Breadcrumb Navigation with optional table stats */}
        {showBreadcrumb && (
          <div className="mb-4">
            <UniversalBreadcrumb tableName={tableName} stats={tableStats} />
          </div>
        )}

        {/* Page header with title, description, and actions - only show when NOT on table detail page */}
        {(!tableName && (title || description || actions)) && (
          <div className="mb-6 rounded-lg border bg-card shadow-sm p-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              {title && <h1 className="text-xl font-semibold tracking-tight lg:text-2xl">{title}</h1>}
              {description && (
                <p className="text-xs text-muted-foreground lg:text-sm">{description}</p>
              )}
            </div>
            {actions && (
              <div className="flex items-center gap-2">{actions}</div>
            )}
          </div>
        )}
        
        {/* Main content */}
        {children}
      </div>
    </div>
  );
}

export default DashboardShell;
