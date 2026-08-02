'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

interface WidgetSettings {
  workspaceId: string;
  primaryColor: string;
  greeting: string;
  suggestedQuestions: string[];
}

interface Message {
  id?: string;
  sender: 'visitor' | 'assistant';
  content: string;
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

    eventSource.onmessage = (event) => {
      const chunk = event.data;
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[assistantMsgIndex];
        if (last) {
          last.content += chunk;
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
    <div className="flex flex-col h-screen bg-slate-950 select-none border border-white/5 rounded-2xl overflow-hidden font-sans">
      <div
        className="p-4 flex items-center justify-between border-b border-white/5 shadow-md shadow-black/20"
        style={{ backgroundColor: config.primaryColor }}
      >
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse border border-white/20" />
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

      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/60 scrollbar-thin scrollbar-thumb-white/5">
        {messages.map((msg, index) => {
          const isBot = msg.sender === 'assistant';
          return (
            <div key={index} className={`flex gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white/90 border border-white/5 ${
                isBot ? 'bg-slate-900' : 'bg-primary/20 text-primary'
              }`}>
                {isBot ? 'AI' : 'ME'}
              </div>
              <div className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed border ${
                isBot
                  ? 'bg-slate-900/60 border-white/5 text-slate-100 rounded-bl-none'
                  : 'bg-primary/10 border-primary/20 text-white rounded-br-none'
              }`}>
                {msg.content || (
                  <div className="flex gap-1.5 py-1">
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {messages.length === 1 && config.suggestedQuestions.length > 0 && (
        <div className="px-4 pb-2 space-y-1.5">
          {config.suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="block w-full text-left px-3.5 py-2 bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-primary/20 rounded-xl text-[10px] text-primary truncate transition-all duration-200"
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
        className="p-3 border-t border-white/5 bg-slate-950 flex gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 bg-white/5 focus:bg-white/10 border border-white/5 focus:border-primary/40 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all duration-200"
        />
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
