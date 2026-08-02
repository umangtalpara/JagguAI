'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { apiRequest } from '../../lib/api';

interface ApiKeyResponse {
  id: string;
  name: string;
  keyMask: string;
  keyPlain?: string;
  createdAt: string;
}

export default function DashboardOverview() {
  const { currentWorkspace } = useAuthStore();
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  useEffect(() => {
    fetchKeys();
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

      if (res.keyPlain) {
        setGeneratedKey(res.keyPlain);
      }
      setNewKeyName('');
      fetchKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to generate key');
    } finally {
      setLoading(false);
    }
  };

  const activeApiKey = keys[0]?.keyMask || 'YOUR_API_KEY';
  const embedCode = `<script src="http://localhost:3001/api/v1/widget/script.js" data-api-key="${activeApiKey}" defer></script>`;

  return (
    <div className="space-y-8">
      <div className="glass glass-glow p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl pointer-events-none" />
        <h2 className="text-2xl font-bold text-white mb-2">Welcome to {currentWorkspace?.name || 'your workspace'}!</h2>
        <p className="text-sm text-muted-foreground">
          Deploy customer-facing AI support agents in minutes. Connect your knowledge base and drop the widget code into your website.
        </p>
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
              className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
            >
              Generate
            </button>
          </form>

          {error && <p className="text-xs text-destructive">{error}</p>}

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
                    <code className="text-[10px] text-muted-foreground">{k.keyMask}</code>
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
            <pre className="bg-slate-950 p-4 rounded-xl border border-white/10 overflow-x-auto text-[11px] text-primary-foreground font-mono leading-relaxed select-all">
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
    </div>
  );
}
