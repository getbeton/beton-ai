'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Table, 
  Search, 
  BarChart3, 
  Settings,
  Zap,
  Mail,
  HomeIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import UserProfileDropdown from './UserProfileDropdown';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  isPrimary?: boolean;
}

const MENU_ITEMS = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
    description: 'Main dashboard',
    isPrimary: true,
    subItems: [
      {
        name: 'Apollo Search',
        href: '/dashboard/apollo-search',
        description: 'Search Apollo.io data'
      },
      {
        name: 'OpenAI Text Generation',
        href: '/dashboard/openai-text-generation',
        description: 'Generate text with OpenAI'
      },
      {
        name: 'LeadMagic Email Finder',
        href: '/dashboard/leadmagic-email-finder',
        description: 'Find business emails'
      },
      {
        name: 'Findymail Email Finder',
        href: '/dashboard/findymail-email-finder',
        description: 'Find emails by name and domain'
      }
    ]
  },
  {
    name: 'Tables',
    href: '/dashboard/tables',
    icon: Table,
    description: 'Manage your data tables',
    isPrimary: true,
  },
  {
    name: 'Jobs',
    href: '/dashboard/jobs',
    icon: BarChart3,
    description: 'View processing status',
  }
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
        <NavigationMenu>
          <NavigationMenuList>
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              if (item.subItems) {
                return (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuTrigger
                      className={cn(
                        "h-9 px-3",
                        active && "bg-accent"
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                        {item.subItems.map((subItem) => (
                          <li key={subItem.name}>
                            <NavigationMenuLink asChild>
                              <Link
                                href={subItem.href}
                                className={cn(
                                  "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                                  isActive(subItem.href) && "bg-accent"
                                )}
                              >
                                <div className="text-sm font-medium leading-none">{subItem.name}</div>
                                <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                  {subItem.description}
                                </p>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              }

              return (
                <NavigationMenuItem key={item.name}>
                  <Link href={item.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={cn(
                        "flex h-9 items-center px-3 gap-2",
                        active && "bg-accent",
                        item.isPrimary && !active && "hover:bg-blue-50 hover:text-blue-700",
                        item.isPrimary && active && "bg-blue-600 hover:bg-blue-700 text-white"
                      )}
                    >
                      <Icon className={cn(
                        "h-4 w-4",
                        item.isPrimary && active && "text-white"
                      )} />
                      <span>{item.name}</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              );
            })}
          </NavigationMenuList>
        </NavigationMenu>

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
      </div>

      {/* Right side - User Profile */}
      <UserProfileDropdown />
    </div>
  );
}

export default MainNavigation; 