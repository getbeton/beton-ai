'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileSpreadsheet,
  Search,
  Webhook,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface EmptyStateProps {
  onImportCSV: () => void;
  onSearchApollo: () => void;
  onConnectWebhook: () => void;
}

const EmptyStateCard = ({
  icon: Icon,
  title,
  description,
  action,
  variant,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  action: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  variant: 'primary' | 'secondary' | 'tertiary';
}) => {
  const gradients = {
    primary: 'bg-gradient-to-br from-[#DEE9FF] to-[#F3F6FF] dark:from-[#10142E] dark:to-[#151B38]',
    secondary: 'bg-gradient-to-br from-[#F1EAFF] to-[#F6F1FF] dark:from-[#1B1733] dark:to-[#211B3F]',
    tertiary: 'bg-gradient-to-br from-[#E7F7F4] to-[#F1FBF9] dark:from-[#0F1F1C] dark:to-[#142924]',
  };

  return (
    <Card className={`${gradients[variant]} relative overflow-hidden border-none shadow-sm transition-transform hover:-translate-y-1`}>
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
      <CardHeader className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-background/80 shadow-sm">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <CardTitle className="text-xl font-semibold text-foreground/90">
          {title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-muted-foreground/80">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant={action.variant} onClick={action.onClick}>
          {action.label}
        </Button>
      </CardContent>
    </Card>
  );
};

export function EmptyState({
  onImportCSV,
  onSearchApollo,
  onConnectWebhook,
}: EmptyStateProps) {
  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="flex w-full max-w-5xl flex-col gap-8">
        <div className="space-y-3">
          <Badge variant="secondary" className="gap-1 bg-secondary/60 text-secondary-foreground/90">
            <Sparkles className="h-3 w-3" />
            Start simple
          </Badge>
          <h1 className="text-3xl font-semibold text-foreground/90 md:text-4xl">
            Create your first table
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Choose how you’d like to get started. You can import existing data, search for contacts, or connect your own data source.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <EmptyStateCard
            variant="primary"
            icon={FileSpreadsheet}
            title="Import CSV"
            description="Upload a CSV file to quickly populate your first table with existing data."
            action={{
              label: 'Choose File',
              onClick: onImportCSV,
            }}
          />
          <EmptyStateCard
            variant="secondary"
            icon={Search}
            title="Search Apollo.io"
            description="Find and import contacts from Apollo.io’s extensive B2B database."
            action={{
              label: 'Search contacts',
              onClick: onSearchApollo,
              variant: 'outline',
            }}
          />
          <EmptyStateCard
            variant="tertiary"
            icon={Webhook}
            title="Connect Webhook"
            description="Send data to a Beton-provided webhook and automatically create tables."
            action={{
              label: 'Get webhook URL',
              onClick: onConnectWebhook,
              variant: 'outline',
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>Need help getting started?</span>
          <Button variant="link" className="h-auto p-0 text-primary" onClick={() => window.open('#', '_blank')}>
            View documentation
            <ArrowUpRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </div>
    </section>
  );
}

export default EmptyState;
