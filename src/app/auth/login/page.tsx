'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, AlertTriangle } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ReliefNetLogo } from '@/components/ui/Logo';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabaseReady = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseReady) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before logging in.');
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ReliefNetLogo className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-white flex items-center justify-center gap-2">
            <Shield className="h-6 w-6 text-blue-400" />
            Coordinator Login
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Sign in to access the operations dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
          {/* Supabase not configured warning */}
          {!supabaseReady && (
            <div className="mb-6 p-4 bg-amber-950/40 border border-amber-700/60 rounded-lg flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-amber-300 mb-1">Supabase Not Configured</p>
                <p className="text-amber-400/80">
                  Authentication requires Supabase credentials. Add{' '}
                  <code className="bg-amber-900/50 px-1 rounded text-amber-300">
                    NEXT_PUBLIC_SUPABASE_URL
                  </code>{' '}
                  and{' '}
                  <code className="bg-amber-900/50 px-1 rounded text-amber-300">
                    NEXT_PUBLIC_SUPABASE_ANON_KEY
                  </code>{' '}
                  to your <code className="bg-amber-900/50 px-1 rounded text-amber-300">.env.local</code> file.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-5 p-3 bg-red-950/40 border border-red-700/60 rounded-lg flex gap-2 text-sm text-red-300">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-400" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coordinator@example.com"
                required
                disabled={loading || !supabaseReady}
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading || !supabaseReady}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || !supabaseReady}
              className="w-full"
              variant="primary"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2 text-sm">
            <p className="text-slate-400">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-blue-400 hover:text-blue-300 underline underline-offset-2">
                Sign up
              </Link>
            </p>
            <p>
              <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
                ← Back to homepage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
