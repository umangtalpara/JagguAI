'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiRequest } from '../../../lib/api';
import { Notification } from '../../../components/ui/Notification';
import { Spinner, PageLoader } from '../../../components/ui/Loader';

interface KnowledgeFile {
  id: string;
  name: string;
  type: string;
  status: string;
  charCount: number;
  chunkCount: number;
  error?: string;
  url?: string;
  createdAt: string;
}

export default function KnowledgeBase() {
  const { currentWorkspace } = useAuthStore();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [activeTab, setActiveTab] = useState<'upload' | 'crawl' | 'faq'>('upload');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [crawlUrl, setCrawlUrl] = useState('');
  const [maxPages, setMaxPages] = useState(10);
  const [crawling, setCrawling] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [savingFaq, setSavingFaq] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

  // Search & Edit states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [editingFaq, setEditingFaq] = useState<KnowledgeFile | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !searchQuery.trim()) {
      return;
    }
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await apiRequest<any[]>(`/workspaces/${currentWorkspace.id}/knowledge/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchResults(res);
    } catch (err: any) {
      showMsg(err.message || 'Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleReindex = async (id: string) => {
    if (!currentWorkspace) {
      return;
    }
    try {
      showMsg('Re-indexing job queued...', 'success');
      await apiRequest(`/workspaces/${currentWorkspace.id}/knowledge/${id}/reindex`, {
        method: 'POST',
      });
      fetchFiles();
    } catch (err: any) {
      showMsg(err.message || 'Re-index failed', 'error');
    }
  };

  const handleEditFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !editingFaq) {
      return;
    }
    setSavingEdit(true);
    try {
      await apiRequest(`/workspaces/${currentWorkspace.id}/knowledge/${editingFaq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          question: editQuestion,
          answer: editAnswer,
        }),
      });
      showMsg('FAQ updated successfully.', 'success');
      setEditingFaq(null);
      fetchFiles();
    } catch (err: any) {
      showMsg(err.message || 'Update failed', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const fetchFiles = async () => {
    if (!currentWorkspace) {
      return;
    }
    try {
      const res = await apiRequest<KnowledgeFile[]>(`/workspaces/${currentWorkspace.id}/knowledge`);
      setFiles(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchFiles();
    const interval = setInterval(fetchFiles, 4000);
    return () => clearInterval(interval);
  }, [currentWorkspace]);

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !selectedFile) {
      return;
    }
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      await apiRequest(`/workspaces/${currentWorkspace.id}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });

      setSelectedFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      showMsg('File uploaded successfully! Processing started.', 'success');
      fetchFiles();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleTriggerCrawl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !crawlUrl.trim()) {
      return;
    }
    setCrawling(true);

    try {
      await apiRequest(`/workspaces/${currentWorkspace.id}/crawler/crawl`, {
        method: 'POST',
        body: JSON.stringify({ url: crawlUrl, maxPages }),
      });

      setCrawlUrl('');
      showMsg('Crawl job queued successfully! Pages will index asynchronously.', 'success');
      fetchFiles();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Crawler trigger failed', 'error');
    } finally {
      setCrawling(false);
    }
  };

  const handleAddFaq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace || !question.trim() || !answer.trim()) {
      return;
    }
    setSavingFaq(true);

    try {
      await apiRequest(`/workspaces/${currentWorkspace.id}/knowledge/faq`, {
        method: 'POST',
        body: JSON.stringify({ question, answer }),
      });

      setQuestion('');
      setAnswer('');
      showMsg('FAQ pair added and indexed successfully.', 'success');
      fetchFiles();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Failed to save FAQ', 'error');
    } finally {
      setSavingFaq(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentWorkspace) {
      return;
    }
    if (!confirm('Are you sure you want to delete this source? This will remove all associated vector points.')) {
      return;
    }

    try {
      await apiRequest(`/workspaces/${currentWorkspace.id}/knowledge/${id}`, {
        method: 'DELETE',
      });
      showMsg('Source deleted successfully.', 'success');
      fetchFiles();
    } catch (err: unknown) {
      showMsg(err instanceof Error ? err.message : 'Deletion failed', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-white">Knowledge Base</h2>
        <p className="text-sm text-muted-foreground">
          Feed files, scrape websites, or manually log FAQs to train your AI support agent.
        </p>
      </div>

      <Notification
        text={message.text}
        type={message.type as 'success' | 'error' | ''}
        onClose={() => setMessage({ text: '', type: '' })}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6 lg:col-span-1">
          <div className="flex border-b border-white/5 pb-px gap-2">
            {(['upload', 'crawl', 'faq'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-xs font-semibold capitalize border-b-2 transition-all ${activeTab === tab
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-white'
                  }`}
              >
                {tab === 'crawl' ? 'Crawler' : tab === 'faq' ? 'FAQs' : 'File Upload'}
              </button>
            ))}
          </div>

          {activeTab === 'upload' && (
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Select Document</label>
                <input
                  id="file-input"
                  type="file"
                  required
                  accept=".pdf,.txt,.docx,.md"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-6 bg-slate-950/40 border border-white/10 border-dashed rounded-xl text-xs text-muted-foreground cursor-pointer focus:outline-none focus:border-primary text-center"
                />
                <span className="text-[10px] text-muted-foreground mt-2 block text-center">
                  Supports PDF, DOCX, TXT, MD up to 10MB
                </span>
              </div>
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <Spinner className="h-4 w-4 border-primary-foreground" />
                ) : (
                  'Index Document'
                )}
              </button>
            </form>
          )}

          {activeTab === 'crawl' && (
            <form onSubmit={handleTriggerCrawl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Seed URL</label>
                <input
                  type="url"
                  required
                  value={crawlUrl}
                  onChange={(e) => setCrawlUrl(e.target.value)}
                  placeholder="https://docs.myproduct.com"
                  className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Max Pages</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={100}
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <button
                type="submit"
                disabled={crawling}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                {crawling ? (
                  <Spinner className="h-4 w-4 border-primary-foreground" />
                ) : (
                  'Run Web Crawler'
                )}
              </button>
            </form>
          )}

          {activeTab === 'faq' && (
            <form onSubmit={handleAddFaq} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Question</label>
                <input
                  type="text"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="What is your return policy?"
                  className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase mb-2">Answer</label>
                <textarea
                  required
                  rows={4}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="We offer a full refund within 30 days of purchase..."
                  className="w-full px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={savingFaq}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs flex items-center justify-center gap-2"
              >
                {savingFaq ? (
                  <Spinner className="h-4 w-4 border-primary-foreground" />
                ) : (
                  'Add FAQ Pair'
                )}
              </button>
            </form>
          )}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6 lg:col-span-2 relative">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-white">Indexed Documents & Sources</h3>
          </div>

          {/* Similarity Search Testing */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Test similarity search query..."
              className="flex-1 px-3 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-primary text-xs"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-4 py-2 bg-secondary border border-white/10 text-white rounded-xl text-xs hover:bg-white/5"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {searchResults.length > 0 && (
            <div className="p-4 bg-slate-950/60 border border-white/5 rounded-xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-primary">Semantic Search Matches:</span>
                <button
                  type="button"
                  onClick={() => setSearchResults([])}
                  className="text-[10px] text-muted-foreground hover:text-white"
                >
                  Clear Results
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {searchResults.map((r, idx) => (
                  <div key={idx} className="p-2.5 bg-slate-900/40 border border-white/5 rounded-lg space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-400">
                      <span>Score: {r.score?.toFixed(4)}</span>
                      <span className="truncate max-w-40">{r.payload?.sourceUrl || 'Manual Input'}</span>
                    </div>
                    <p className="text-[11px] text-slate-200 leading-relaxed italic">"{r.payload?.content}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
            {files.length === 0 ? (
              <div className="py-12 text-center">
                <span className="text-xs text-muted-foreground">No indexed data sources found. Get started on the left!</span>
              </div>
            ) : (
              files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-950/40 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex flex-col gap-1 min-w-0 pr-4">
                    <span className="text-xs font-semibold text-white truncate max-w-[280px]" title={file.name}>{file.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-muted-foreground font-mono uppercase">{file.type}</span>
                      <span className="text-[10px] text-muted-foreground">{file.charCount.toLocaleString()} chars</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-muted-foreground">{file.chunkCount} vectors</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${file.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : file.status === 'processing'
                          ? 'bg-yellow-500/10 text-yellow-400 animate-pulse'
                          : file.status === 'failed'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-white/10 text-muted-foreground'
                      }`}>
                      {file.status}
                    </span>

                    {/* Edit FAQ Button */}
                    {file.type === 'faq' && (
                      <button
                        onClick={() => {
                          setEditingFaq(file);
                          setEditQuestion(file.name.replace(/^FAQ:\s+/, '').replace(/\.\.\.$/, ''));
                          setEditAnswer('');
                        }}
                        className="p-1.5 hover:bg-white/5 border border-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        title="Edit FAQ"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-2.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    )}

                    {/* Re-index Button */}
                    {file.type !== 'faq' && (
                      <button
                        onClick={() => handleReindex(file.id)}
                        className="p-1.5 hover:bg-white/5 border border-white/5 rounded-lg text-muted-foreground hover:text-white transition-colors"
                        title="Re-index Document"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 7.89M9 11l3-3 3 3m-3-3v12" />
                        </svg>
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(file.id)}
                      className="p-1.5 hover:bg-destructive/15 border border-white/5 hover:border-destructive/20 rounded-lg text-muted-foreground hover:text-destructive-foreground transition-colors"
                      title="Delete Source"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Edit FAQ Dialog Modal Overlay */}
          {editingFaq && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-bold text-white">Edit FAQ Content</h4>
                  <button
                    type="button"
                    onClick={() => setEditingFaq(null)}
                    className="text-slate-400 hover:text-white text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
                <form onSubmit={handleEditFaqSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Question</label>
                    <input
                      type="text"
                      required
                      value={editQuestion}
                      onChange={(e) => setEditQuestion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 block font-medium">Answer</label>
                    <textarea
                      required
                      rows={4}
                      value={editAnswer}
                      onChange={(e) => setEditAnswer(e.target.value)}
                      placeholder="Enter new answer..."
                      className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:border-primary resize-none"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingFaq(null)}
                      className="flex-1 py-2 border border-white/10 rounded-xl text-xs text-white hover:bg-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingEdit}
                      className="flex-1 py-2 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
