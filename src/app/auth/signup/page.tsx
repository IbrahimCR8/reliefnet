import Link from 'next/link';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReliefNetLogo } from '@/components/ui/Logo';

export default function SignupPage() {
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
            Coordinator Registration
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Restricted Operational Access
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-full">
              <Lock className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <h2 className="text-lg font-semibold text-white mb-2">
            Public Registration Closed
          </h2>

          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            ReliefNet operates with a maximum of <strong className="text-slate-200">3 pre-authorized coordinators</strong>. Public user registration is disabled to prevent unauthorized administrative access.
          </p>

          <div className="space-y-3">
            <Link href="/auth/login" className="block w-full">
              <Button variant="primary" className="w-full">
                Go to Coordinator Login
              </Button>
            </Link>

            <Link
              href="/"
              className="inline-block text-sm text-slate-500 hover:text-slate-300 transition-colors pt-2"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
