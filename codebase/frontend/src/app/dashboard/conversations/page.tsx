'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiRequest } from '../../../lib/api';

interface Conversation {
  id: string;
  visitorId: string;
  createdAt: string;
}

interface Message {
  id: string;
  sender: 'visitor' | 'assistant';
  content: string;
  createdAt: string;
}

export default function ConversationsInspector() {
  const { currentWorkspace } = useAuthStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const fetchConversations = async () => {
    if (!currentWorkspace) return;
    setLoadingList(true);
    try {
      const res = await apiRequest<any[]>(`/chat/workspaces/${currentWorkspace.id}/conversations`);
      const mapped = res.map(c => ({
        id: c._id || c.id,
        visitorId: c.visitorId,
        createdAt: c.createdAt,
      }));
      setConversations(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchMessages = async (convoId: string) => {
    setLoadingMessages(true);
    try {
      const res = await apiRequest<Message[]>(`/chat/conversations/${convoId}/messages`);
      setMessages(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    setSelectedConvo(null);
    setMessages([]);
  }, [currentWorkspace]);

  useEffect(() => {
    if (selectedConvo) {
      fetchMessages(selectedConvo.id);
    }
  }, [selectedConvo]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-1 sm:gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Conversations</h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Inspect visitor chat history, monitor transcripts, and analyze chatbot performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 min-h-[500px] sm:min-h-[550px]">
        {/* Left Side: Conversations List - visible on desktop, or on mobile when no convo is selected */}
        <div
          className={`glass p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col md:col-span-1 space-y-4 ${
            selectedConvo ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider">
              Active &amp; Past Sessions
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/5">
              {conversations.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[60vh] md:max-h-[450px] space-y-2 pr-1 scrollbar-thin scrollbar-thumb-white/5">
            {loadingList ? (
              <div className="text-center py-8">
                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">No conversation history found.</p>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConvo?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvo(c)}
                    className={`w-full text-left p-3 sm:p-3.5 rounded-xl border transition-all duration-200 block ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-white shadow shadow-primary/10'
                        : 'bg-slate-950/40 border-white/5 text-slate-300 hover:border-white/10 hover:bg-slate-950/60'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1 gap-2">
                      <span className="text-[11px] font-bold tracking-wide truncate max-w-[140px]" title={c.visitorId}>
                        ID: {c.visitorId.substring(0, 13)}...
                      </span>
                      <span className="text-[9px] text-slate-500 shrink-0">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-slate-400">
                      <span className="truncate">Started: {new Date(c.createdAt).toLocaleTimeString()}</span>
                      <span className="md:hidden text-primary font-semibold">View →</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Message Transcript Viewer - visible on desktop, or on mobile when convo is selected */}
        <div
          className={`glass p-4 sm:p-6 rounded-2xl border border-white/5 flex flex-col md:col-span-2 space-y-4 min-h-[450px] sm:min-h-[500px] ${
            selectedConvo ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedConvo ? (
            <>
              <div className="flex items-center justify-between border-b border-white/5 pb-3 sm:pb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setSelectedConvo(null)}
                    className="md:hidden p-1.5 hover:bg-white/5 border border-white/10 rounded-lg text-slate-300 hover:text-white transition-colors shrink-0"
                    aria-label="Back to sessions"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="min-w-0">
                    <h4 className="text-xs sm:text-sm font-bold text-white truncate">Session Transcript</h4>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[200px] sm:max-w-xs">
                      Visitor: {selectedConvo.visitorId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => fetchMessages(selectedConvo.id)}
                  className="px-2.5 py-1 hover:bg-white/5 rounded-lg text-xs border border-white/10 text-slate-300 shrink-0 transition-colors"
                >
                  Refresh
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[55vh] md:max-h-[380px] p-3 sm:p-4 bg-slate-950/30 border border-white/5 rounded-xl space-y-3 sm:space-y-4 scrollbar-thin scrollbar-thumb-white/5">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full min-h-[160px]">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-slate-500 italic text-center py-12">No messages in this conversation.</p>
                ) : (
                  messages.map((m, idx) => {
                    const isBot = m.sender === 'assistant';
                    return (
                      <div key={m.id || idx} className={`flex gap-2 sm:gap-2.5 ${isBot ? '' : 'flex-row-reverse'}`}>
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white border border-white/5 select-none shrink-0 ${
                            isBot ? 'bg-slate-900' : 'bg-primary/20 text-primary'
                          }`}
                        >
                          {isBot ? 'AI' : 'ME'}
                        </div>
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] p-2.5 sm:p-3 rounded-xl text-xs leading-relaxed border break-words ${
                            isBot
                              ? 'bg-slate-900/60 border-white/5 text-slate-200'
                              : 'bg-primary/10 border-primary/20 text-white'
                          }`}
                        >
                          <p>{m.content}</p>
                          <span className="text-[8px] text-slate-500 block mt-1 text-right">
                            {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 sm:p-8 space-y-3">
              <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-slate-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-xs text-muted-foreground max-w-xs">
                Select a conversation from the sidebar to inspect the transcript history.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
