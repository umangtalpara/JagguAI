'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth-store';
import { apiRequest } from '../../lib/api';
import { PageLoader, Spinner } from '../../components/ui/Loader';

interface Workspace {
  id: string;
  name: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, accessToken, workspaces, currentWorkspace, clearAuth, setWorkspaces, setCurrentWorkspace, _hasHydrated } = useAuthStore();
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncingWorkspaces, setSyncingWorkspaces] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer when pathname changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    // Wait until Zustand has finished rehydrating state from localStorage
    if (!_hasHydrated) {
      return;
    }

    if (!accessToken) {
      router.push('/');
      return;
    }

    const fetchAndSyncWorkspaces = async () => {
      setSyncingWorkspaces(true);
      try {
        const fetched = await apiRequest<Workspace[]>('/workspaces');
        setWorkspaces(fetched);
        if (fetched.length > 0) {
          const activeId = useAuthStore.getState().currentWorkspace?.id;
          const exists = fetched.some(w => w.id === activeId);
          if (!activeId || !exists) {
            setCurrentWorkspace(fetched[0]);
          }
        }
      } catch (err) {
        console.error('Failed to sync workspaces:', err);
      } finally {
        setSyncingWorkspaces(false);
      }
    };

    fetchAndSyncWorkspaces();
  }, [_hasHydrated, accessToken, router, setWorkspaces, setCurrentWorkspace]);

  // Show page loader while zustand rehydrates or while token is being verified
  if (!_hasHydrated) {
    return <PageLoader text="Loading your session..." />;
  }

  if (!accessToken) {
    return null;
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) {
      return;
    }
    setLoading(true);

    try {
      const res = await apiRequest<Workspace>('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: newWorkspaceName }),
      });

      const updatedWorkspaces = [...workspaces, res];
      setWorkspaces(updatedWorkspaces);
      setCurrentWorkspace(res);
      setNewWorkspaceName('');
      setShowWorkspaceModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (syncingWorkspaces) {
    return <PageLoader text="Syncing workspace settings..." />;
  }

  if (workspaces.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md glass glass-glow p-8 rounded-2xl border border-white/10 shadow-2xl relative z-10 space-y-6">
          <div className="flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-white">Create Your First Workspace</h3>
            <p className="text-xs text-muted-foreground mt-2 max-w-xs">
              Welcome to jagguAI! To get started, please create a workspace for your company or support team.
            </p>
          </div>

          <form onSubmit={handleCreateWorkspace} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Workspace Name
              </label>
              <input
                type="text"
                required
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                placeholder="e.g. Acme Corp Support"
                className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-sm mt-2 flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
            >
              {loading ? (
                <Spinner className="h-5 w-5 border-white" />
              ) : (
                'Create Workspace'
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
        </svg>
      ),
    },
    {
      name: 'Knowledge Base',
      href: '/dashboard/knowledge',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
        </svg>
      ),
    },
    {
      name: 'Widget Settings',
      href: '/dashboard/widget',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
    },
    {
      name: 'Conversations',
      href: '/dashboard/conversations',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden relative">
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Off-Canvas Drawer */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[80vw] bg-card/95 backdrop-blur-xl border-r border-white/10 flex flex-col transform transition-transform duration-300 ease-in-out lg:hidden shadow-2xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow shadow-primary/20">
              <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-white tracking-wide text-sm">jagguAI Panel</span>
          </div>
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                clearAuth();
                router.push('/');
              }}
              className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex w-64 border-r border-white/5 bg-card/60 backdrop-blur-md flex-col z-20 shrink-0">
        <div className="h-16 flex items-center gap-3 px-6 border-b border-white/5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center shadow shadow-primary/20">
            <svg className="w-4 h-4 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-bold text-white tracking-wide">jagguAI Panel</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-slate-950/20">
          <div className="flex items-center justify-between">
            <div className="flex flex-col min-w-0 pr-2">
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{user?.email}</span>
            </div>
            <button
              onClick={() => {
                clearAuth();
                router.push('/');
              }}
              className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-destructive transition-colors shrink-0"
              title="Sign Out"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        <header className="h-16 border-b border-white/5 bg-card/40 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
          {/* Left: Mobile hamburger & Workspace Switcher */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50"
              aria-label="Open sidebar navigation"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold hidden sm:inline">
                Workspace:
              </span>
              <div className="flex items-center gap-1.5 min-w-0">
                <select
                  value={currentWorkspace?.id || ''}
                  onChange={(e) => {
                    const ws = workspaces.find((w) => w.id === e.target.value);
                    if (ws) {
                      setCurrentWorkspace(ws);
                    }
                  }}
                  className="bg-slate-950 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs sm:text-sm focus:outline-none focus:border-primary max-w-[140px] sm:max-w-[200px] md:max-w-xs truncate"
                >
                  {workspaces.map((ws) => (
                    <option key={ws.id} value={ws.id}>
                      {ws.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => setShowWorkspaceModal(true)}
                  className="p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-primary transition-colors shrink-0"
                  title="Create Workspace"
                  aria-label="Create Workspace"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Quick info or status badge */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <div className="max-w-6xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>

      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-white/10 w-full max-w-sm rounded-2xl p-5 sm:p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Create New Workspace</h3>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Workspace Name
                </label>
                <input
                  type="text"
                  required
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="e.g. Acme Corp Support"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-sm"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWorkspaceModal(false)}
                  className="px-4 py-2 hover:bg-white/5 border border-white/10 rounded-xl text-white text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
                >
                  {loading ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
