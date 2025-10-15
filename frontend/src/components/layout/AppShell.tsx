"use client";

import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";
import { logComponentRender } from "@/lib/debug";

type AppShellProps = {
  /** Main content for the current view. */
  children: ReactNode;
  /** Additional classes for the main container. */
  mainClassName?: string;
};

/**
 * AppShell provides the main application layout structure with navigation.
 * 
 * Features:
 * - Responsive header-based navigation (replaces sidebar)
 * - Mobile menu with hamburger icon
 * - User dropdown with sign out
 * - Desktop navigation with active states
 * - Beton branding and logo
 * 
 * Uses the new Navbar component based on COSS comp-587.
 */
export function AppShell({
  children,
  mainClassName,
}: AppShellProps) {
  logComponentRender("AppShell");

  return (
    <div className="relative min-h-screen flex flex-col bg-background">
      <Navbar />
      <main
        className={cn(
          "flex flex-1 flex-col",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default AppShell;
