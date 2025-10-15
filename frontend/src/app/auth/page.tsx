'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Zap, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AuthPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50 flex flex-col justify-center py-12 px-4">
      <div className="mx-auto w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-6">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
          
          <div className="flex items-center justify-center space-x-3">
            <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-3xl font-bold">Beton-AI</span>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-muted-foreground">
              Sign in to your automation platform
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-xl">Sign in to your account</CardTitle>
            <CardDescription>
              Choose your preferred sign-in method below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                style: {
                  button: {
                    background: 'var(--primary)',
                    color: 'var(--primary-foreground)',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    border: 'none',
                    padding: '12px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    height: '40px',
                    transition: 'all 0.2s',
                  },
                  anchor: {
                    color: 'var(--primary)',
                    textDecoration: 'none',
                    fontSize: '14px',
                  },
                  message: {
                    color: 'hsl(var(--destructive-foreground))',
                    background: 'hsl(var(--destructive) / 0.1)',
                    border: '1px solid hsl(var(--destructive) / 0.2)',
                    borderRadius: 'calc(var(--radius) - 2px)',
                    padding: '12px',
                    marginBottom: '16px',
                    fontSize: '14px',
                  },
                  input: {
                    borderRadius: 'calc(var(--radius) - 2px)',
                    border: '1px solid hsl(var(--border))',
                    padding: '12px',
                    fontSize: '14px',
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    height: '40px',
                    transition: 'all 0.2s',
                  },
                  label: {
                    color: 'hsl(var(--foreground))',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px',
                  },
                  divider: {
                    background: 'hsl(var(--border))',
                    margin: '24px 0',
                  },
                  container: {
                    gap: '16px',
                  },
                },
                variables: {
                  default: {
                    colors: {
                      brand: 'var(--primary)',
                      brandAccent: 'var(--primary)',
                      inputBackground: 'var(--background)',
                      inputText: 'var(--foreground)',
                      inputBorder: 'var(--border)',
                      inputBorderHover: 'var(--border)',
                      inputBorderFocus: 'var(--primary)',
                    },
                    space: {
                      spaceSmall: '8px',
                      spaceMedium: '16px',
                      spaceLarge: '24px',
                    },
                    borderWidths: {
                      buttonBorderWidth: '0px',
                      inputBorderWidth: '1px',
                    },
                    radii: {
                      borderRadiusButton: 'calc(var(--radius) - 2px)',
                      buttonBorderRadius: 'calc(var(--radius) - 2px)',
                      inputBorderRadius: 'calc(var(--radius) - 2px)',
                    },
                  },
                },
              }}
              providers={['google', 'github']}
              redirectTo={`${typeof window !== 'undefined' ? window.location.origin : ''}/dashboard`}
              socialLayout="horizontal"
              view="sign_in"
              showLinks={true}
              magicLink={false}
            />
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline">
              Privacy Policy
            </a>
          </p>
          
          <div className="text-sm text-muted-foreground">
            Don't have an account? The sign-up form will appear after clicking "Sign In"
          </div>
        </div>
      </div>
    </div>
  );
} 