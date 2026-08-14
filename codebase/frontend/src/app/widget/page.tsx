'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface WidgetSettings {
  workspaceId: string;
  primaryColor: string;
  greeting: string;
  suggestedQuestions: string[];
  logoUrl?: string;
  avatarUrl?: string;
  theme?: string;
  voiceEnabled?: boolean;
}

interface Message {
  id?: string;
  sender: 'visitor' | 'assistant';
  content: string;
  sources?: { title: string; url: string }[];
}

function WidgetContent() {
  const searchParams = useSearchParams();
  const apiKey = searchParams.get('apiKey');

  const [config, setConfig] = useState<WidgetSettings | null>(null);
  const [visitorId, setVisitorId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadEmail, setLeadEmail] = useState('');
  const [leadName, setLeadName] = useState('');

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const API_BASE = 'http://localhost:3001/api/v1';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!apiKey) {
      setError('Missing API Key parameter');
      return;
    }

    let storedVid = localStorage.getItem('jagu-visitor-id');
    if (!storedVid) {
      storedVid = crypto.randomUUID();
      localStorage.setItem('jagu-visitor-id', storedVid);
    }
    setVisitorId(storedVid);

    const isCaptured = localStorage.getItem('jagu-lead-captured') === 'true';
    setLeadCaptured(isCaptured);

    fetch(`${API_BASE}/widget/config?apiKey=${apiKey}`)
      .then(res => {
        if (!res.ok) {
          throw new Error('Invalid API Key');
        }
        return res.json() as Promise<WidgetSettings>;
      })
      .then(settings => {
        setConfig(settings);
        
        fetch(`${API_BASE}/chat/workspaces/${settings.workspaceId}/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId: storedVid }),
        })
          .then(r => r.json() as Promise<Message[]>)
          .then(history => {
            if (history.length === 0) {
              setMessages([
                {
                  sender: 'assistant',
                  content: settings.greeting,
                },
              ]);
            } else {
              setMessages(history);
            }
          });
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to connect');
      });
  }, [apiKey]);

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadEmail.trim() || !config) {
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/widget/workspaces/${config.workspaceId}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId,
          email: leadEmail,
          name: leadName,
        }),
      });
      if (res.ok) {
        localStorage.setItem('jagu-lead-captured', 'true');
        setLeadCaptured(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        if (!config) return;
        setStreaming(true);

        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.webm');
        formData.append('visitorId', visitorId);

        try {
          setMessages(prev => [...prev, { sender: 'visitor', content: '🎙️ Transcribing voice message...' }]);

          const res = await fetch(`${API_BASE}/voice/workspaces/${config.workspaceId}/process`, {
            method: 'POST',
            body: formData,
          });

          if (!res.ok) {
            throw new Error('Failed to process voice');
          }

          const transcribedText = decodeURIComponent(res.headers.get('X-Transcribed-Text') || '');
          const responseText = decodeURIComponent(res.headers.get('X-Response-Text') || '');

          const audioArrayBuffer = await res.arrayBuffer();
          const audioBlobUrl = URL.createObjectURL(new Blob([audioArrayBuffer], { type: 'audio/mpeg' }));
          const audioPlayer = new Audio(audioBlobUrl);
          audioPlayer.play();

          setMessages(prev => {
            const copy = [...prev];
            const lastIndex = copy.length - 1;
            if (copy[lastIndex]) {
              copy[lastIndex].content = `🎙️ ${transcribedText}`;
            }
            return [...copy, { sender: 'assistant', content: responseText }];
          });

        } catch (err) {
          console.error(err);
          setMessages(prev => [...prev, { sender: 'assistant', content: 'Sorry, I failed to process your voice input.' }]);
        } finally {
          setStreaming(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Failed to start voice recording:', err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSend = (text: string) => {
    if (!text.trim() || !config || streaming) {
      return;
    }

    const userMsg: Message = { sender: 'visitor', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setStreaming(true);

    const assistantMsgIndex = messages.length + 1;
    setMessages(prev => [...prev, { sender: 'assistant', content: '' }]);

    const sseUrl = `${API_BASE}/chat/workspaces/${config.workspaceId}/stream?visitorId=${visitorId}&content=${encodeURIComponent(text.trim())}`;
    const eventSource = new EventSource(sseUrl);

    let assistantReply = '';
    let citations: { title: string; url: string }[] = [];

    eventSource.onmessage = (event) => {
      const chunk = event.data;
      if (chunk.startsWith('[METADATA]:')) {
        try {
          const meta = JSON.parse(chunk.substring(11));
          if (meta.sources) {
            citations = meta.sources;
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        assistantReply += chunk;
      }

      setMessages(prev => {
        const copy = [...prev];
        const last = copy[assistantMsgIndex];
        if (last) {
          last.content = assistantReply;
          last.sources = citations;
        }
        return copy;
      });
    };

    eventSource.onerror = () => {
      eventSource.close();
      setStreaming(false);
    };
  };

  const handleClose = () => {
    window.parent.postMessage('jagu-close-widget', '*');
  };

  const renderMarkdown = (text: string) => {
    if (!text) return '';
    let html = text
      .replace(/\r\n/g, '\n')
      .replace(/\n\n/g, '<br/><br/>')
      .replace(/\n/g, '<br/>');

    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Convert bullet lists
    html = html.replace(/(?:^|<br\/>)[*-]\s+(.*?)(?=<br\/>|$)/g, '$&<span class="inline-block w-1.5 h-1.5 bg-current/60 rounded-full mx-2 align-middle"></span>$1');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
  };

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-6 bg-slate-950 text-red-400 text-xs text-center">
        {error}
      </div>
    );
  }

  if (!config) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen select-none border rounded-2xl overflow-hidden font-sans transition-all duration-300 ${
      config.theme === 'light' ? 'bg-white text-slate-800 border-slate-200' : 'bg-slate-950 text-white border-white/5'
    }`}>
      <div
        className="p-4 flex items-center justify-between shadow-md shadow-black/20"
        style={{ backgroundColor: config.primaryColor }}
      >
        <div className="flex items-center gap-2">
          {config.logoUrl ? (
            <img src={config.logoUrl} alt="Logo" className="h-5 w-auto object-contain rounded" />
          ) : (
            <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse border border-white/20" />
          )}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider leading-none">Support Agent</h4>
            <span className="text-[9px] text-white/75 leading-none">Trained on Docs</span>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-white/10 rounded-lg text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!leadCaptured ? (
        <div className={`flex-1 flex flex-col justify-center p-6 ${
          config.theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/80 backdrop-blur-md'
        }`}>
          <form onSubmit={handleLeadSubmit} className="space-y-4">
            <div className="text-center space-y-1.5 mb-6">
              <h4 className={`text-sm font-bold ${config.theme === 'light' ? 'text-slate-800' : 'text-white'}`}>Let's get started!</h4>
              <p className="text-[10px] text-slate-400">Please introduce yourself to start chatting with support.</p>
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-medium">Name</label>
              <input
                type="text"
                required
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                placeholder="John Doe"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                  config.theme === 'light'
                    ? 'bg-slate-200/50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary/50'
                    : 'bg-white/5 border border-white/10 focus:border-primary/50 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 block font-medium">Email Address</label>
              <input
                type="email"
                required
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="john@example.com"
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all ${
                  config.theme === 'light'
                    ? 'bg-slate-200/50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary/50'
                    : 'bg-white/5 border border-white/10 focus:border-primary/50 text-white placeholder-slate-500'
                }`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ backgroundColor: config.primaryColor }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {loading ? 'Submitting...' : 'Start Chat'}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className={`flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-white/5 ${
            config.theme === 'light' ? 'bg-slate-50' : 'bg-slate-950/60'
          }`}>
            {messages.map((msg, index) => {
              const isBot = msg.sender === 'assistant';
              return (
                <div key={index} className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                  {isBot ? (
                    config.avatarUrl ? (
                      <img src={config.avatarUrl} alt="Avatar" className="h-7 w-7 rounded-full object-cover border border-white/10 bg-slate-850" />
                    ) : (
                      <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white/90 border border-white/5 bg-slate-900">AI</div>
                    )
                  ) : (
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-primary border border-primary/20 bg-primary/10">ME</div>
                  )}
                  <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed border ${
                    isBot
                      ? config.theme === 'light'
                        ? 'bg-slate-200/70 border-slate-300/40 text-slate-900 rounded-bl-none'
                        : 'bg-slate-900/60 border-white/5 text-slate-100 rounded-bl-none'
                      : 'bg-primary/10 border-primary/20 text-primary-foreground rounded-br-none'
                  }`} style={!isBot ? { backgroundColor: config.primaryColor } : undefined}>
                    {msg.content ? renderMarkdown(msg.content) : (
                      <div className="flex gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    )}

                    {/* Citations/References rendering */}
                    {isBot && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-500/10 space-y-1.5">
                        <span className="text-[8px] font-bold text-slate-500 block uppercase tracking-wider">Citations:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.sources.map((s, sIdx) => (
                            <a
                              key={sIdx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[9px] bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary px-1.5 py-0.5 rounded transition-all truncate max-w-[120px]"
                              title={s.title}
                            >
                              {s.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {messages.length === 1 && config.suggestedQuestions.length > 0 && (
            <div className={`px-4 pb-2 space-y-1.5 ${config.theme === 'light' ? 'bg-slate-50' : ''}`}>
              {config.suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q)}
                  className={`block w-full text-left px-3.5 py-2 border rounded-xl text-[10px] truncate transition-all duration-200 ${
                    config.theme === 'light'
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300/60 text-slate-800'
                      : 'bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-primary/20 text-primary'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputText);
            }}
            className={`p-3 border-t flex gap-2 ${
              config.theme === 'light' ? 'border-slate-200 bg-slate-50' : 'border-white/5 bg-slate-950'
            }`}
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask me anything..."
              className={`flex-1 rounded-xl px-3.5 py-2.5 text-xs focus:outline-none transition-all duration-200 ${
                config.theme === 'light'
                  ? 'bg-slate-200/50 border border-slate-300 text-slate-800 placeholder-slate-400 focus:border-primary/40'
                  : 'bg-white/5 focus:bg-white/10 border border-white/5 focus:border-primary/40 text-white placeholder-slate-500'
              }`}
            />
            
            {/* Microphone Toggle Button (Conditional) */}
            {config.voiceEnabled && (
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`p-2.5 rounded-xl flex items-center justify-center border transition-all ${
                  recording 
                    ? 'bg-red-500/10 border-red-500 text-red-500 animate-pulse'
                    : config.theme === 'light'
                      ? 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
                      : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
            )}

            <button
              type="submit"
              disabled={streaming || !inputText.trim()}
              className="p-2.5 rounded-xl flex items-center justify-center text-primary-foreground disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: config.primaryColor }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
}

export default function WidgetIframe() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <WidgetContent />
    </Suspense>
  );
}
