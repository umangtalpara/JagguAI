'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { apiRequest } from '../lib/api';
import { Notification } from '../components/ui/Notification';
import { Spinner } from '../components/ui/Loader';

interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface WorkspaceResponse {
  id: string;
  name: string;
}

export default function Home() {
  const router = useRouter();
  const { user, setAuth, setWorkspaces, setCurrentWorkspace } = useAuthStore();
  const [view, setView] = useState<'login' | 'register' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (view === 'login') {
        const res = await apiRequest<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
        
        setAuth(res.user, res.accessToken);

        const workspaces = await apiRequest<WorkspaceResponse[]>('/workspaces');
        setWorkspaces(workspaces);
        if (workspaces.length > 0) {
          setCurrentWorkspace(workspaces[0]);
        }
        router.push('/dashboard');
      } else if (view === 'register') {
        const registerRes = await apiRequest<{ success: boolean }>('/auth/register', {
          method: 'POST',
          body: JSON.stringify({ email, password, name }),
        });

        if (registerRes.success) {
          setView('login');
          setSuccess('Registration successful! Please login with your credentials.');
        }
      } else if (view === 'forgot') {
        const forgotRes = await apiRequest<{ success: boolean; token: string }>('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        if (forgotRes.success) {
          setSuccess(`Reset token generated: ${forgotRes.token}`);
          setResetToken(forgotRes.token);
          setView('reset');
        }
      } else if (view === 'reset') {
        const resetRes = await apiRequest<{ success: boolean }>('/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ email, token: resetToken, newPassword: password }),
        });
        if (resetRes.success) {
          setView('login');
          setSuccess('Password reset successful! Please sign in with your new password.');
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-950/40 via-background to-background">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="var(--background)" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-primary bg-clip-text text-transparent">
            JaguAI Platform
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            AI Customer Support Agents for Enterprise SaaS
          </p>
        </div>

        <div className="glass glass-glow p-8 rounded-2xl border border-white/10 shadow-2xl space-y-6">
          <h2 className="text-xl font-semibold text-white">
            {view === 'login' && 'Sign in to dashboard'}
            {view === 'register' && 'Create your account'}
            {view === 'forgot' && 'Forgot Password'}
            {view === 'reset' && 'Reset Password'}
          </h2>

          <Notification
            text={error || success}
            type={error ? 'error' : success ? 'success' : ''}
            onClose={() => { setError(''); setSuccess(''); }}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
              />
            </div>

            {view === 'reset' && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Reset Token
                </label>
                <input
                  type="text"
                  required
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  placeholder="Paste your reset token here"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            )}

            {(view === 'login' || view === 'register' || view === 'reset') && (
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {view === 'reset' ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary transition-colors text-sm"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-sm mt-6 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
            >
              {loading ? (
                <Spinner className="h-5 w-5 border-white" />
              ) : view === 'login' ? (
                'Sign In'
              ) : view === 'register' ? (
                'Sign Up'
              ) : view === 'forgot' ? (
                'Request Token'
              ) : (
                'Reset Password'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-3 text-center">
            <button
              onClick={() => {
                setView(view === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-xs text-primary hover:underline"
            >
              {view === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            {view === 'login' && (
              <button
                onClick={() => {
                  setView('forgot');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Forgot your password?
              </button>
            )}
            {view === 'forgot' && (
              <button
                onClick={() => {
                  setView('login');
                  setError('');
                  setSuccess('');
                }}
                className="text-xs text-muted-foreground hover:text-white transition-colors"
              >
                Back to Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
