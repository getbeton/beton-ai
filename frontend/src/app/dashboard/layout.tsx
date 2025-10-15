"use client";

import { AppShell } from '@/components/layout/AppShell';

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <AppShell>{children}</AppShell>
  );
}

