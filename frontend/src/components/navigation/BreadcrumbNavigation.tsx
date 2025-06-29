'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { 
  Home,
  Table,
  ChevronRight
} from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface BreadcrumbSegment {
  label: string;
  href?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbNavigationProps {
  customSegments?: BreadcrumbSegment[];
  tableName?: string;
}

export function BreadcrumbNavigation({ customSegments, tableName }: BreadcrumbNavigationProps) {
  const pathname = usePathname();
  const [segments, setSegments] = useState<BreadcrumbSegment[]>([]);

  useEffect(() => {
    if (customSegments) {
      setSegments(customSegments);
      return;
    }

    // Generate breadcrumbs based on pathname
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs: BreadcrumbSegment[] = [
      {
        label: 'Dashboard',
        href: '/dashboard',
        icon: Home,
      },
    ];

    // Handle different page structures
    if (pathSegments.includes('tables')) {
      if (pathSegments.length === 1 || (pathSegments.length === 2 && pathSegments[1] === 'tables')) {
        // Dashboard or /dashboard/tables -> just Dashboard (Tables is implied)
        // Don't add extra segments since Tables is the primary view
      } else if (pathSegments.length >= 3 && pathSegments[1] === 'tables') {
        // /dashboard/tables/[id] or deeper
        breadcrumbs.push({
          label: 'Tables',
          href: '/dashboard',
          icon: Table,
        });
        
        if (tableName) {
          breadcrumbs.push({
            label: tableName,
          });
        } else {
          breadcrumbs.push({
            label: 'Table Details',
          });
        }
      }
    } else if (pathSegments.includes('apollo-search')) {
      breadcrumbs.push({
        label: 'Apollo Search',
      });
    } else if (pathSegments.includes('jobs')) {
      breadcrumbs.push({
        label: 'Jobs',
      });
    } else if (pathSegments.includes('settings')) {
      breadcrumbs.push({
        label: 'Settings',
      });
    }

    setSegments(breadcrumbs);
  }, [pathname, customSegments, tableName]);

  // Don't show breadcrumbs if there's only one segment (just Dashboard)
  if (segments.length <= 1) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const Icon = segment.icon;

          return (
            <div key={index} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-4 w-4" />}
                    {segment.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={segment.href!} className="flex items-center gap-1.5">
                      {Icon && <Icon className="h-4 w-4" />}
                      {segment.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export default BreadcrumbNavigation; 