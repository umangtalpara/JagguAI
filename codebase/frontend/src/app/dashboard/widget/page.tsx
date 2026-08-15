'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
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

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  streaming?: boolean;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const VISITOR_ID = 'preview-test-user-' + Math.random().toString(36).slice(2, 8);

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

  // Chat preview state
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchSettings = async () => {
    if (!currentWorkspace) return;
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

  // Reset chat when workspace changes
  useEffect(() => {
    setMessages([]);
    stopAudioPlayback();
  }, [currentWorkspace]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      stopAudioPlayback();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const stopAudioPlayback = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
  };

  const speakText = (text: string) => {
    if (!text || typeof window === 'undefined') return;
    stopAudioPlayback();
    if ('speechSynthesis' in window) {
      try {
        const cleanText = text
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          .replace(/\*([^*]+)\*/g, '$1')
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
          .replace(/#{1,6}\s+/g, '')
          .replace(/`{1,3}[^`]*`{1,3}/g, '')
          .trim();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onstart = () => setIsPlayingAudio(true);
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error('Speech synthesis error:', err);
        setIsPlayingAudio(false);
      }
    }
  };

  const playAudioBuffer = async (audioBuffer: ArrayBuffer, fallbackText: string) => {
    try {
      stopAudioPlayback();
      if (audioBuffer && audioBuffer.byteLength > 200) {
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioBlobUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioBlobUrl);
        currentAudioRef.current = audio;
        setIsPlayingAudio(true);

        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioBlobUrl);
        };

        audio.onerror = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioBlobUrl);
          speakText(fallbackText);
        };

        await audio.play();
      } else {
        speakText(fallbackText);
      }
    } catch (err) {
      console.warn('Audio tag playback failed, falling back to speech synthesis:', err);
      speakText(fallbackText);
    }
  };

  const startRecording = async () => {
    if (!currentWorkspace || isStreaming || isRecording) return;
    stopAudioPlayback();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm')
        ? { mimeType: 'audio/webm' }
        : typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/mp4')
        ? { mimeType: 'audio/mp4' }
        : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());

        if (!currentWorkspace) return;

        const tempUserMsgId = Date.now().toString();
        const tempAssistantMsgId = (Date.now() + 1).toString();

        setMessages((prev) => [
          ...prev,
          { id: tempUserMsgId, role: 'user', content: '🎙️ Processing voice note...' },
          { id: tempAssistantMsgId, role: 'assistant', content: '', streaming: true },
        ]);
        setIsStreaming(true);
        setVoiceStatus('Transcribing & generating voice reply...');

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('visitorId', VISITOR_ID);

        try {
          const res = await fetch(`${API_BASE}/voice/workspaces/${currentWorkspace.id}/process`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Voice endpoint responded with status ${res.status}`);
          }

          const rawTranscribed = res.headers.get('X-Transcribed-Text');
          const rawResponse = res.headers.get('X-Response-Text');
          const transcribedText = rawTranscribed ? decodeURIComponent(rawTranscribed) : '🎙️ Voice Message';
          const responseText = rawResponse ? decodeURIComponent(rawResponse) : '';

          const audioBuffer = await res.arrayBuffer();

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === tempUserMsgId) return { ...m, content: `🎙️ ${transcribedText}` };
              if (m.id === tempAssistantMsgId) return { ...m, content: responseText || 'Voice response received.', streaming: false };
              return m;
            })
          );

          setVoiceStatus('Playing audio response...');
          await playAudioBuffer(audioBuffer, responseText);
          setVoiceStatus('');
        } catch (err) {
          console.error('Voice processing error:', err);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempAssistantMsgId
                ? { ...m, content: 'Failed to process voice. Please check backend service and API keys.', streaming: false }
                : m
            )
          );
          setVoiceStatus('');
        } finally {
          setIsStreaming(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setVoiceStatus('Listening... Click mic again to send');
    } catch (err) {
      console.error('Microphone error:', err);
      setMessage({
        text: 'Microphone access denied or not available. Please allow mic permission.',
        type: 'error',
      });
      setIsRecording(false);
      setVoiceStatus('');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceStatus('Analyzing speech...');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace) return;
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
      setMessage({ text: err instanceof Error ? err.message : 'Save failed', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setSettings({ ...settings, suggestedQuestions: [...settings.suggestedQuestions, newQuestion.trim()] });
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    const list = [...settings.suggestedQuestions];
    list.splice(idx, 1);
    setSettings({ ...settings, suggestedQuestions: list });
  };

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || !currentWorkspace || isStreaming) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMsg: Message = { id: assistantMsgId, role: 'assistant', content: '', streaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setInputValue('');
    setIsStreaming(true);

    try {
      const token = useAuthStore.getState().accessToken;
      const url = new URL(`${API_BASE}/chat/workspaces/${currentWorkspace.id}/stream`);
      url.searchParams.set('visitorId', VISITOR_ID);
      url.searchParams.set('content', text);

      const eventSource = new EventSource(url.toString() + (token ? `&token=${encodeURIComponent(token)}` : ''));
      let fullContent = '';

      abortRef.current = () => eventSource.close();

      eventSource.onmessage = (e) => {
        const raw: string = e.data ?? '';
        if (!raw || raw === '[DONE]') return;

        // Skip metadata source lines
        if (raw.startsWith('[METADATA]:')) return;

        // The stream yields raw text chunks directly
        fullContent += raw;
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, content: fullContent, streaming: true } : m)
        );
      };

      eventSource.addEventListener('done', () => {
        eventSource.close();
        setMessages(prev =>
          prev.map(m => m.id === assistantMsgId ? { ...m, streaming: false } : m)
        );
        setIsStreaming(false);
        abortRef.current = null;
        inputRef.current?.focus();
      });

      eventSource.onerror = () => {
        eventSource.close();
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: fullContent || 'Sorry, something went wrong. Please try again.', streaming: false }
              : m
          )
        );
        setIsStreaming(false);
        abortRef.current = null;
      };
    } catch (err) {
      console.error(err);
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: 'Connection error. Please check your backend is running.', streaming: false }
            : m
        )
      );
      setIsStreaming(false);
    }
  }, [currentWorkspace, isStreaming]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(inputValue);
    }
  };

  const clearChat = () => {
    if (abortRef.current) abortRef.current();
    stopAudioPlayback();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setVoiceStatus('');
    setMessages([]);
    setIsStreaming(false);
  };

  const isDark = settings.theme === 'dark';

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Settings Form */}
        <form onSubmit={handleSave} className="glass p-6 rounded-2xl border border-white/5 space-y-6">
          <h3 className="text-lg font-semibold text-white">Appearance &amp; Branding</h3>

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
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } }}
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
                <span key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] text-white">
                  {q}
                  <button type="button" onClick={() => handleRemoveQuestion(idx)} className="text-muted-foreground hover:text-red-400 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
          >
            {saving ? <Spinner className="h-4 w-4 border-primary-foreground" /> : 'Save Settings'}
          </button>
        </form>

        {/* Live Demo Preview */}
        <div className="lg:sticky lg:top-8 space-y-3">
          {/* Header bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-white uppercase tracking-wider">Live Bot Tester</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={clearChat}
                  className="text-[10px] px-2.5 py-1 rounded-lg border border-white/10 text-muted-foreground hover:text-white hover:bg-white/5 transition-colors"
                >
                  Clear Chat
                </button>
              )}
              <span className="text-[10px] px-2.5 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-semibold">
                Connected to {currentWorkspace?.name || 'Workspace'}
              </span>
            </div>
          </div>

          {/* Widget shell */}
          <div className={`rounded-2xl border shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
            isDark ? 'bg-slate-950 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-800'
          }`} style={{ height: '520px' }}>

            {/* Header */}
            <div className="p-4 flex items-center justify-between flex-shrink-0" style={{ backgroundColor: settings.primaryColor }}>
              <div className="flex items-center gap-2">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo" className="h-5 w-auto object-contain rounded" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
                )}
                <span className="text-xs font-bold text-white uppercase tracking-wide">AI Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                {isPlayingAudio && (
                  <span className="text-[9px] text-white/90 bg-white/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                    Speaking
                  </span>
                )}
                <span className="text-[9px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full font-medium">TEST MODE</span>
              </div>
            </div>

            {/* Messages area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDark ? 'bg-slate-950' : 'bg-slate-50/50'}`}>
              {/* Greeting message */}
              {messages.length === 0 && (
                <div className="flex gap-2 items-end">
                  {settings.avatarUrl ? (
                    <img src={settings.avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full object-cover flex-shrink-0 border border-white/10" />
                  ) : (
                    <div className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: settings.primaryColor }}>AI</div>
                  )}
                  <div className={`group relative max-w-[78%] p-3 rounded-2xl rounded-bl-none text-xs leading-relaxed border ${
                    isDark ? 'bg-white/5 border-white/5 text-white' : 'bg-white border-slate-200 text-slate-800'
                  }`}>
                    {settings.greeting}
                    {settings.voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => speakText(settings.greeting)}
                        className="ml-2 inline-flex items-center text-muted-foreground hover:text-primary transition-colors opacity-70 group-hover:opacity-100"
                        title="Listen to message"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 10H4a1 1 0 00-1 1v2a1 1 0 001 1h2l3.5 3.5A1 1 0 0011 17V7a1 1 0 00-1.5-.86L6 10z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Suggested questions (only shown when no messages) */}
              {messages.length === 0 && settings.suggestedQuestions.length > 0 && (
                <div className="space-y-1.5 pl-8">
                  {settings.suggestedQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(q)}
                      disabled={isStreaming || isRecording}
                      className={`block w-full text-left px-3 py-1.5 border rounded-xl text-[10px] truncate transition-colors ${
                        isDark
                          ? 'bg-white/5 hover:bg-white/10 border-white/5 text-slate-300 disabled:opacity-50'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-600 disabled:opacity-50'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Conversation */}
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    settings.avatarUrl ? (
                      <img src={settings.avatarUrl} alt="Avatar" className="h-6 w-6 rounded-full object-cover flex-shrink-0 border border-white/10" />
                    ) : (
                      <div className="h-6 w-6 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: settings.primaryColor }}>AI</div>
                    )
                  )}
                  <div className={`group relative max-w-[78%] px-3 py-2.5 rounded-2xl text-xs leading-relaxed border ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-none border-transparent'
                      : isDark
                        ? 'bg-white/5 border-white/5 text-white rounded-bl-none'
                        : 'bg-white border-slate-200 text-slate-800 rounded-bl-none'
                  }`} style={msg.role === 'user' ? { backgroundColor: settings.primaryColor } : {}}>
                    {msg.content || (msg.streaming ? (
                      <span className="flex gap-1 items-center h-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    ) : '')}
                    {msg.streaming && msg.content && (
                      <span className="inline-block w-0.5 h-3 bg-current ml-0.5 animate-pulse align-middle" />
                    )}

                    {/* Speaker button on assistant message */}
                    {msg.role === 'assistant' && msg.content && !msg.streaming && settings.voiceEnabled && (
                      <button
                        type="button"
                        onClick={() => speakText(msg.content)}
                        className="ml-2 inline-flex items-center text-muted-foreground hover:text-primary transition-colors opacity-60 group-hover:opacity-100 align-middle"
                        title="Replay voice audio"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M6 10H4a1 1 0 00-1 1v2a1 1 0 001 1h2l3.5 3.5A1 1 0 0011 17V7a1 1 0 00-1.5-.86L6 10z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Voice status banner */}
            {(isRecording || voiceStatus) && (
              <div className={`px-4 py-1.5 text-[10px] font-medium flex items-center justify-between border-t transition-all ${
                isRecording
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-primary/10 border-primary/20 text-primary'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-rose-500 animate-ping' : 'bg-primary animate-pulse'}`} />
                  <span>{isRecording ? 'Recording audio... Speak your question' : voiceStatus}</span>
                </div>
                {isRecording && (
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="underline text-[10px] hover:text-white font-semibold"
                  >
                    Done (Send)
                  </button>
                )}
              </div>
            )}

            {/* Input area */}
            <div className={`p-3 border-t flex gap-2 flex-shrink-0 ${isDark ? 'border-white/5 bg-slate-950/80' : 'border-slate-200 bg-white'}`}>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isStreaming || isRecording || !currentWorkspace}
                placeholder={
                  isRecording
                    ? 'Recording voice...'
                    : currentWorkspace
                    ? 'Ask me anything...'
                    : 'Select a workspace first'
                }
                className={`flex-1 rounded-xl px-3 py-2 text-xs focus:outline-none transition-colors ${
                  isDark
                    ? 'bg-white/5 border border-white/5 text-white placeholder-slate-500 focus:border-white/20'
                    : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-300'
                } disabled:opacity-50`}
              />
              {settings.voiceEnabled && (
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isStreaming || !currentWorkspace}
                  className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                    isRecording
                      ? 'bg-rose-500 text-white border-rose-500 animate-pulse ring-2 ring-rose-500/40'
                      : isDark
                        ? 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
                        : 'border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200'
                  } disabled:opacity-40`}
                  title={isRecording ? 'Stop recording and send audio' : 'Speak to AI Bot'}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </button>
              )}
              <button
                type="button"
                onClick={() => sendMessage(inputValue)}
                disabled={isStreaming || isRecording || !inputValue.trim() || !currentWorkspace}
                className="p-2 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: settings.primaryColor }}
              >
                {isStreaming ? (
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Helper tip */}
          <p className="text-[10px] text-muted-foreground text-center">
            💡 Voice enabled: Click the microphone to speak and hear the bot respond in voice audio.
          </p>
        </div>
      </div>
    </div>
  );
}
