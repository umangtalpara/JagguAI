'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { apiRequest } from '../../lib/api';
import { Notification } from '../../components/ui/Notification';
import { Spinner, CardSkeleton } from '../../components/ui/Loader';

interface ApiKeyResponse {
  id: string;
  name: string;
  keyMask?: string;
  keyMasked?: string;
  apiKey?: string;
  keyPlain?: string;
  createdAt: string;
}

interface AnalyticsResponse {
  totalChats: number;
  totalVisitors: number;
  avgResponseTimeMs: number;
  voiceSessionsCount: number;
  popularQuestions: { queryText: string; count: number }[];
  leads: {
    id: string;
    email: string;
    name: string;
    visitorId: string;
    createdAt: string;
  }[];
  failedAnswers: {
    id: string;
    visitorId: string;
    queryText: string;
    responseTimeMs: number;
    createdAt: string;
  }[];
}

export default function DashboardOverview() {
  const { currentWorkspace } = useAuthStore();
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);

  const fetchKeys = async () => {
    if (!currentWorkspace) {
      return;
    }
    try {
      const res = await apiRequest<ApiKeyResponse[]>(`/workspaces/${currentWorkspace.id}/api-keys`);
      setKeys(res);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalytics = async () => {
    if (!currentWorkspace) {
      return;
    }
    try {
      const res = await apiRequest<AnalyticsResponse>(`/workspaces/${currentWorkspace.id}/analytics`);
      setAnalytics(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchKeys();
    fetchAnalytics();
  }, [currentWorkspace]);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !newKeyName.trim()) {
      return;
    }
    setLoading(true);
    setError('');
    setGeneratedKey('');

    try {
      const res = await apiRequest<ApiKeyResponse>(`/workspaces/${currentWorkspace.id}/api-keys`, {
        method: 'POST',
        body: JSON.stringify({ name: newKeyName }),
      });

      const plainKey = res.apiKey || res.keyPlain;
      if (plainKey) {
        setGeneratedKey(plainKey);
      }
      setNewKeyName('');
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const activeApiKey = keys[0]?.keyMasked || keys[0]?.keyMask || 'YOUR_API_KEY';
  const embedCode = `<script src="http://localhost:3001/api/v1/widget/script.js" data-api-key="${activeApiKey}" defer></script>`;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="glass glass-glow p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to {currentWorkspace?.name || 'your workspace'}!</h2>
        <p className="text-sm text-muted-foreground">
          Deploy customer-facing AI support agents in minutes. Connect your knowledge base and drop the widget code into your website.
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Chats</span>
          <span className="text-3xl font-bold text-white tracking-tight">
            {analytics?.totalChats ?? 0}
          </span>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl" />
          <span className="text-xs font-medium text-slate-400 block mb-1">Total Visitors</span>
          <span className="text-3xl font-bold text-cyan-400 tracking-tight">
            {analytics?.totalVisitors ?? 0}
          </span>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl" />
          <span className="text-xs font-medium text-slate-400 block mb-1">Avg Response Time</span>
          <span className="text-3xl font-bold text-violet-400 tracking-tight">
            {analytics?.avgResponseTimeMs ? `${(analytics.avgResponseTimeMs / 1000).toFixed(1)}s` : '0s'}
          </span>
        </div>
        <div className="glass p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl" />
          <span className="text-xs font-medium text-slate-400 block mb-1">Voice Sessions</span>
          <span className="text-3xl font-bold text-rose-400 tracking-tight">
            {analytics?.voiceSessionsCount ?? 0}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-white">API Keys</h3>
          <p className="text-xs text-muted-foreground">
            Generate credentials to secure widget configuration queries.
          </p>

          <form onSubmit={handleGenerateKey} className="flex gap-2">
            <input
              type="text"
              required
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="e.g. Production Key"
              className="flex-1 px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
            >
              {loading ? (
                <Spinner className="h-4 w-4 border-primary-foreground" />
              ) : (
                'Generate'
              )}
            </button>
          </form>

          <Notification
            text={error}
            type={error ? 'error' : ''}
            onClose={() => setError('')}
          />

          {generatedKey && (
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl space-y-2">
              <span className="text-xs font-semibold text-primary block">Save your generated API Key (shown only once):</span>
              <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded border border-white/10">
                <code className="text-xs text-white select-all break-all">{generatedKey}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(generatedKey)}
                  className="p-1 hover:bg-white/5 rounded text-primary text-[10px]"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            <span className="text-xs font-semibold text-white block">Existing Keys</span>
            {keys.length === 0 ? (
              <p className="text-xs text-muted-foreground">No API keys found.</p>
            ) : (
              keys.map((k) => (
                <div key={k.id} className="flex items-center justify-between p-3 bg-slate-950/40 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-white">{k.name}</span>
                    <code className="text-[10px] text-muted-foreground">{k.keyMasked || k.keyMask}</code>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(k.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-white">Embed Script</h3>
          <p className="text-xs text-muted-foreground">
            Copy and paste this script tag at the bottom of your HTML body to embed the JaguAI support bubble.
          </p>

          <div className="relative group">
            <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto text-[11px] text-sky-400 font-mono leading-relaxed select-all">
              {embedCode}
            </pre>
            <button
              onClick={() => navigator.clipboard.writeText(embedCode)}
              className="absolute top-2 right-2 px-2.5 py-1 bg-white/5 hover:bg-primary/20 text-white rounded text-[10px] border border-white/10"
            >
              Copy
            </button>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/10 p-4 rounded-xl text-xs text-muted-foreground space-y-2 leading-relaxed">
            <span className="font-semibold text-white block">💡 Deployment Tips</span>
            <ul className="list-disc pl-4 space-y-1">
              <li>Place the script tag right before the closing <code className="text-white">&lt;/body&gt;</code> tag.</li>
              <li>Make sure you use the key generated for this workspace.</li>
              <li>Customize colors and assistant greetings inside the "Widget Settings" tab.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Captured Leads & Failed Answers List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leads Table */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Captured Contact Leads</h3>
          <p className="text-xs text-slate-400">
            Contacts captured through the chatbot widget.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {!analytics?.leads || analytics.leads.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No leads captured yet.</p>
            ) : (
              analytics.leads.map((l) => (
                <div key={l.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-white block">{l.name || 'Anonymous'}</span>
                    <span className="text-[10px] text-slate-400">{l.email}</span>
                  </div>
                  <span className="text-[10px] text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Failed Answers Table */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Unanswered Queries (Gap Analysis)</h3>
          <p className="text-xs text-slate-400">
            Visitor questions where the AI found insufficient context.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {!analytics?.failedAnswers || analytics.failedAnswers.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No failed answers flagged.</p>
            ) : (
              analytics.failedAnswers.map((f) => (
                <div key={f.id} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-red-400 font-semibold">Flagged Gap</span>
                    <span className="text-[10px] text-slate-500">{new Date(f.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-white text-xs italic">"{f.queryText}"</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Popular Questions Table */}
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-lg font-semibold text-white">Popular User Queries</h3>
          <p className="text-xs text-slate-400">
            Most frequently asked visitor questions.
          </p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {!analytics?.popularQuestions || analytics.popularQuestions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center">No queries logged yet.</p>
            ) : (
              analytics.popularQuestions.map((pq, idx) => (
                <div key={idx} className="p-3 bg-slate-950/40 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-white italic truncate max-w-[200px]" title={pq.queryText}>"{pq.queryText}"</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">{pq.count}x</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
