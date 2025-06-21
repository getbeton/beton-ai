'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, Zap, Shield, Code, Users, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
        
        if (session?.user) {
          router.push('/dashboard');
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
        setUser(session?.user || null);
        if (session?.user) {
          router.push('/dashboard');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-gray-50">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Beton-AI</span>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </a>
            <Button asChild>
              <Link href="/auth">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="mx-auto w-full max-w-4xl text-center space-y-8">
          <Badge variant="secondary" className="mb-4">
            🚀 Open Source & Free
          </Badge>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
            Automate Your Workflow with{' '}
            <span className="text-primary">Intelligence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Streamline your business processes with our powerful automation platform. 
            Connect APIs, manage integrations, and boost productivity for both technical and sales teams.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild>
              <Link href="/auth" className="group">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="pt-8 flex flex-wrap justify-center items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>100% Open Source</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Docker Ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="mx-auto w-full max-w-5xl">
          <div className="text-center mb-16 space-y-4">
            <Badge variant="outline">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight">
              Everything You Need to Automate
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern teams who want to work smarter, not harder.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>API Management</CardTitle>
                <CardDescription>
                  Securely store and manage all your API keys in one centralized location with enterprise-grade encryption.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Secure Authentication</CardTitle>
                <CardDescription>
                  Multiple sign-in options including Google, GitHub, and email with industry-standard security practices.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="relative overflow-hidden">
              <CardHeader>
                <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Team Friendly</CardTitle>
                <CardDescription>
                  Designed for both technical developers and sales teams with an intuitive, user-friendly interface.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="mx-auto w-full max-w-3xl text-center space-y-8">
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to Automate Your Workflow?
          </h2>
          <p className="text-lg text-muted-foreground">
            Join thousands of teams already using Beton-AI to streamline their processes.
          </p>
          <Button size="lg" asChild>
            <Link href="/auth" className="group">
              Get Started for Free
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12 px-4">
        <div className="mx-auto w-full max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Beton-AI</span>
            </div>
            <div className="text-muted-foreground text-sm">
              © 2025 Beton-AI. Open source automation platform.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 