'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Table, 
  Search, 
  BarChart3, 
  Settings,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import UserProfileDropdown from './UserProfileDropdown';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isPrimary?: boolean;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Tables',
    href: '/dashboard/tables',
    icon: Table,
    description: 'Manage your data tables',
    isPrimary: true,
  },
  {
    name: 'Apollo Search',
    href: '/dashboard/apollo-search',
    icon: Search,
    description: 'Search prospect data',
  },
  {
    name: 'Jobs',
    href: '/dashboard/jobs',
    icon: BarChart3,
    description: 'View processing status',
  },
];

const secondaryItems: NavigationItem[] = [
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    description: 'App configuration',
  },
];

export function MainNavigation() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/dashboard/tables') {
      return pathname === '/dashboard' || pathname.startsWith('/dashboard/tables');
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - Logo and Navigation */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Beton-AI
          </span>
        </div>
        <Separator orientation="vertical" className="h-6" />
        <nav className="flex items-center space-x-1 lg:space-x-2">
      {/* Primary Navigation */}
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <Link key={item.name} href={item.href}>
            <Button
              variant={active ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex items-center gap-2 h-9 px-3",
                item.isPrimary && !active && "hover:bg-blue-50 hover:text-blue-700",
                item.isPrimary && active && "bg-blue-600 hover:bg-blue-700"
              )}
            >
              <Icon className={cn(
                "h-4 w-4",
                item.isPrimary && active ? "text-white" : active ? "text-white" : "text-current"
              )} />
              <span className="hidden sm:inline">{item.name}</span>
            </Button>
          </Link>
        );
      })}

          {/* Separator */}
          <div className="hidden lg:block h-6 w-px bg-border mx-2" />

          {/* Secondary Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            {secondaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className="flex items-center gap-2 h-9 px-3"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden xl:inline">{item.name}</span>
                  </Button>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Right side - User Profile */}
      <UserProfileDropdown />
    </div>
  );
}

export default MainNavigation; 