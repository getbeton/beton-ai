'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { captureLandingAction } from '@/lib/analytics';

export default function Home() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        router.push('/auth');
      } else {
        setChecking(false);
      }
    };

    checkSession();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-3 text-muted-foreground">Preparing your workspace...</p>
      </div>
    );
  }

  const handleAction = (action: 'import_csv' | 'search_apollo' | 'send_webhook') => {
    captureLandingAction(action);

    switch (action) {
      case 'import_csv':
        router.push('/dashboard?t=import');
        break;
      case 'search_apollo':
        router.push('/dashboard/integrations?flow=apollo');
        break;
      case 'send_webhook':
        window.open('https://github.com/getbeton/beton-ai/issues/new', '_blank', 'noopener');
        break;
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 px-6 py-16">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold sm:text-4xl">What do you want to do next?</h1>
          <p className="text-muted-foreground">
            Choose one of the core workflows below to continue.
          </p>
        </div>

        <div className="grid w-full gap-4">
          <Button size="lg" onClick={() => handleAction('import_csv')}>
            Import CSV
          </Button>
          <Button size="lg" onClick={() => handleAction('search_apollo')}>
            Search with Apollo
          </Button>
          <Button
            size="lg"
            variant="outline"
            data-ph-ignore
            onClick={() => handleAction('send_webhook')}
          >
            Send Webhook
          </Button>
        </div>
      </div>
    </main>
  );
}