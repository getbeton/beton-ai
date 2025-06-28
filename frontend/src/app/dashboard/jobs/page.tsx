'use client'

import { JobsDashboard } from '@/components/JobsDashboard'

export default function JobsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Jobs Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and manage your bulk download jobs
        </p>
      </div>
      <JobsDashboard onJobSelect={(job) => console.log('Selected job:', job)} />
    </div>
  )
} 