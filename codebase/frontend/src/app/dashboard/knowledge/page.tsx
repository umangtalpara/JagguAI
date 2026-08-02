'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiRequest } from '../../../lib/api';

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
  const [maxPages, setMaxPages] = useState(30);
  const [crawling, setCrawling] = useState(false);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [savingFaq, setSavingFaq] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });

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

      {message.text && (
        <div className={`p-4 rounded-xl border text-sm ${
          message.type === 'success'
            ? 'bg-primary/10 border-primary/20 text-primary'
            : 'bg-destructive/10 border-destructive/20 text-destructive-foreground'
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="glass p-6 rounded-2xl border border-white/5 space-y-6 lg:col-span-1">
          <div className="flex border-b border-white/5 pb-px gap-2">
            {(['upload', 'crawl', 'faq'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 pb-3 text-xs font-semibold capitalize border-b-2 transition-all ${
                  activeTab === tab
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
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
              >
                {uploading ? 'Uploading...' : 'Index Document'}
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
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
              >
                {crawling ? 'Crawling...' : 'Run Web Crawler'}
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
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 text-xs"
              >
                {savingFaq ? 'Saving...' : 'Add FAQ Pair'}
              </button>
            </form>
          )}
        </div>

        <div className="glass p-6 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-white">Indexed Documents & Sources</h3>

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

                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold ${
                      file.status === 'completed'
                        ? 'bg-green-500/10 text-green-400'
                        : file.status === 'processing'
                        ? 'bg-yellow-500/10 text-yellow-400 animate-pulse'
                        : file.status === 'failed'
                        ? 'bg-red-500/10 text-red-400'
                        : 'bg-white/10 text-muted-foreground'
                    }`}>
                      {file.status}
                    </span>

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
        </div>
      </div>
    </div>
  );
}
