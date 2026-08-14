'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiRequest } from '../../../lib/api';
import { Notification } from '../../../components/ui/Notification';
import { Spinner } from '../../../components/ui/Loader';

interface WidgetSettings {
  primaryColor: string;
  logoUrl: string;
  avatarUrl: string;
  greeting: string;
  theme: string;
  position: string;
  voiceEnabled: boolean;
  suggestedQuestions: string[];
}

export default function WidgetCustomizer() {
  const { currentWorkspace } = useAuthStore();
  const [settings, setSettings] = useState<WidgetSettings>({
    primaryColor: '#2563eb',
    logoUrl: '',
    avatarUrl: '',
    greeting: 'Hello! How can I help you today?',
    theme: 'light',
    position: 'bottom-right',
    voiceEnabled: true,
    suggestedQuestions: [],
  });

  const [saving, setSaving] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchSettings = async () => {
    if (!currentWorkspace) {
      return;
    }
    try {
      const res = await apiRequest<WidgetSettings>(`/workspaces/${currentWorkspace.id}/widget`);
      if (res) {
        setSettings({
          primaryColor: res.primaryColor || '#2563eb',
          logoUrl: res.logoUrl || '',
          avatarUrl: res.avatarUrl || '',
          greeting: res.greeting || 'Hello! How can I help you today?',
          theme: res.theme || 'light',
          position: res.position || 'bottom-right',
          voiceEnabled: typeof res.voiceEnabled === 'boolean' ? res.voiceEnabled : true,
          suggestedQuestions: res.suggestedQuestions || [],
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [currentWorkspace]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) {
      return;
    }
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      await apiRequest(`/workspaces/${currentWorkspace.id}/widget`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      setMessage({ text: 'Widget settings updated successfully.', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    } catch (err: unknown) {
      setMessage({
        text: err instanceof Error ? err.message : 'Save failed',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      return;
    }
    setSettings({
      ...settings,
      suggestedQuestions: [...settings.suggestedQuestions, newQuestion.trim()],
    });
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    const list = [...settings.suggestedQuestions];
    list.splice(idx, 1);
    setSettings({ ...settings, suggestedQuestions: list });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Widget Settings</h2>
        <p className="text-sm text-muted-foreground">
          Customize the chat widget color theme, default greetings, and suggested query templates.
        </p>
      </div>

      <Notification
        text={message.text}
        type={message.type as 'success' | 'error' | ''}
        onClose={() => setMessage({ text: '', type: '' })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <form onSubmit={handleSave} className="glass p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-white">Appearance & Branding</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="w-10 h-10 border border-white/10 rounded cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                  className="flex-1 px-3 py-1.5 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Position</label>
              <select
                value={settings.position}
                onChange={(e) => setSettings({ ...settings, position: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="bottom-right">Bottom Right</option>
                <option value="bottom-left">Bottom Left</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Logo URL</label>
              <input
                type="text"
                value={settings.logoUrl}
                onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                placeholder="https://example.com/logo.png"
                className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Avatar URL</label>
              <input
                type="text"
                value={settings.avatarUrl}
                onChange={(e) => setSettings({ ...settings, avatarUrl: e.target.value })}
                placeholder="https://example.com/avatar.png"
                className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Theme</label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                className="w-full bg-slate-950 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="voiceEnabled"
                checked={settings.voiceEnabled}
                onChange={(e) => setSettings({ ...settings, voiceEnabled: e.target.checked })}
                className="w-4 h-4 rounded border-white/10 bg-slate-950 text-primary focus:ring-primary"
              />
              <label htmlFor="voiceEnabled" className="text-xs font-semibold text-muted-foreground uppercase cursor-pointer">Voice Enabled</label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Default Welcome Greeting</label>
            <input
              type="text"
              required
              value={settings.greeting}
              onChange={(e) => setSettings({ ...settings, greeting: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Suggested Prompt Questions</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="e.g. How do I upgrade my plan?"
                className="flex-1 px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-secondary border border-white/10 text-white rounded-xl text-xs hover:bg-white/5"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {settings.suggestedQuestions.map((q, idx) => (
                <span
                  key={idx}
                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-white"
                >
                  {q}
                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="text-muted-foreground hover:text-red-400 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
          >
            {saving ? (
              <Spinner className="h-4 w-4 border-primary-foreground" />
            ) : (
              'Save Settings'
            )}
          </button>
        </form>

        <div className="glass p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center space-y-6 min-h-[500px]">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Live Preview</span>
          
          <div className={`w-[340px] h-[480px] rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            settings.theme === 'light'
              ? 'bg-white border-slate-200 text-slate-800'
              : 'bg-slate-950 border-white/10 text-white'
          }`}>
            <div className="p-4 flex items-center justify-between border-b border-white/5" style={{ backgroundColor: settings.primaryColor }}>
              <div className="flex items-center gap-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-5 w-auto object-contain rounded" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                )}
                <span className="text-xs font-bold text-white uppercase tracking-wide">AI Assistant</span>
              </div>
              <button type="button" className="text-white hover:opacity-80">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col justify-end">
              <div className="flex gap-2 items-end">
                {settings.avatarUrl ? (
                  <img src={settings.avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full object-cover border border-white/10 bg-slate-850" />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white">AI</div>
                )}
                <div className={`max-w-[75%] p-3 rounded-2xl rounded-bl-none text-xs leading-relaxed border ${
                  settings.theme === 'light'
                    ? 'bg-slate-100 border-slate-200 text-slate-800'
                    : 'bg-white/5 border-white/5 text-white'
                }`}>
                  {settings.greeting}
                </div>
              </div>

              <div className="space-y-1.5">
                {settings.suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`block w-full text-left px-3 py-1.5 border rounded-xl text-[10px] truncate ${
                      settings.theme === 'light'
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className={`p-3 border-t flex gap-2 ${
              settings.theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-slate-950'
            }`}>
              <input
                type="text"
                disabled
                placeholder="Ask me anything..."
                className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none ${
                  settings.theme === 'light'
                    ? 'bg-slate-200/50 border border-slate-300 text-slate-800 placeholder-slate-500'
                    : 'bg-white/5 border border-white/5 text-white placeholder-slate-500'
                }`}
              />
              {settings.voiceEnabled && (
                <button
                  type="button"
                  disabled
                  className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                    settings.theme === 'light'
                      ? 'border-slate-300 bg-slate-100 text-slate-600'
                      : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                  title="Voice Mode Enabled"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                disabled
                className="p-2 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: settings.primaryColor }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
