/**
 * Main Navigation Bar Component
 * 
 * Based on COSS comp-587 with Beton branding and customizations.
 * Features:
 * - Beton logo and branding
 * - Navigation links for dashboard sections
 * - User menu with sign out
 * - Mobile responsive with hamburger menu
 */

'use client';

import { usePathname } from "next/navigation"
import Link from "next/link"
import { 
  LayoutDashboard, 
  Settings,
  Search,
  Zap,
  Mail
} from "lucide-react"

import UserMenu from "@/components/navbar-components/user-menu"
import { TrowelIcon } from "@/components/icons/TrowelIcon"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/integrations", label: "Integrations", icon: Settings },
  { href: "/dashboard/apollo-search", label: "Apollo", icon: Search },
  { href: "/dashboard/findymail-email-finder", label: "Findymail", icon: Mail },
  { href: "/dashboard/leadmagic-email-finder", label: "Leadmagic", icon: Zap },
  { href: "/dashboard/openai-text-generation", label: "OpenAI", icon: Zap },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="border-b px-4 md:px-6 bg-background">
      <div className="flex h-16 items-center justify-between gap-4">
        {/* Left side */}
        <div className="flex flex-1 items-center gap-4">
          {/* Mobile menu trigger */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                className="group size-8 md:hidden"
                variant="ghost"
                size="icon"
                aria-label="Toggle navigation menu"
              >
                <svg
                  className="pointer-events-none"
                  width={16}
                  height={16}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12L20 12"
                    className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                  />
                  <path
                    d="M4 12H20"
                    className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                  />
                </svg>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-48 p-1 md:hidden">
              <NavigationMenu className="max-w-none *:w-full">
                <NavigationMenuList className="flex-col items-start gap-0">
                  {navigationLinks.map((link) => {
                    const Icon = link.icon
                    const isActive = pathname === link.href || 
                                   (link.href !== "/dashboard" && pathname.startsWith(link.href))
                    
                    return (
                      <NavigationMenuItem key={link.href} className="w-full">
                        <Link href={link.href} legacyBehavior passHref>
                          <NavigationMenuLink
                            className={`flex w-full flex-row items-center gap-2 py-2 px-3 rounded-md transition-colors ${
                              isActive 
                                ? 'bg-primary/10 text-primary font-medium' 
                                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                            }`}
                          >
                            <Icon
                              size={16}
                              className="shrink-0"
                              aria-hidden="true"
                            />
                            <span>{link.label}</span>
                          </NavigationMenuLink>
                        </Link>
                      </NavigationMenuItem>
                    )
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </PopoverContent>
          </Popover>
          
          {/* Logo and Brand */}
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <TrowelIcon className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Beton
            </span>
          </Link>
        </div>
        
        {/* Middle area - Desktop Navigation */}
        <NavigationMenu className="max-md:hidden">
          <NavigationMenuList className="gap-1">
            {navigationLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href || 
                             (link.href !== "/dashboard" && pathname.startsWith(link.href))
              
              return (
                <NavigationMenuItem key={link.href}>
                  <Link href={link.href} legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`flex flex-row items-center gap-2 py-1.5 px-3 rounded-md font-medium transition-colors ${
                        isActive 
                          ? 'bg-primary/10 text-primary' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      }`}
                    >
                      <Icon
                        size={16}
                        className="shrink-0"
                        aria-hidden="true"
                      />
                      <span>{link.label}</span>
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              )
            })}
          </NavigationMenuList>
        </NavigationMenu>
        
        {/* Right side - User Menu */}
        <div className="flex flex-1 items-center justify-end">
          <UserMenu />
        </div>
      </div>
    </header>
  )
}

