'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth-store';
import { apiRequest } from '../../../lib/api';

interface ApiKeyResponse {
  id: string;
  name: string;
  keyMask?: string;
  keyMasked?: string;
  apiKey?: string;
  keyPlain?: string;
  createdAt: string;
}

export default function HelpIntegrationPage() {
  const { currentWorkspace } = useAuthStore();
  const [keys, setKeys] = useState<ApiKeyResponse[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'html' | 'react' | 'nextjs' | 'vue' | 'angular' | 'cms'>('html');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchKeys = async () => {
      if (!currentWorkspace) return;
      try {
        const res = await apiRequest<ApiKeyResponse[]>(`/workspaces/${currentWorkspace.id}/api-keys`);
        setKeys(res);
        if (res.length > 0) {
          const fullKey = res[0].apiKey || res[0].keyPlain || res[0].keyMasked || 'YOUR_API_KEY';
          setSelectedKey(fullKey);
        } else {
          setSelectedKey('YOUR_API_KEY');
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchKeys();
  }, [currentWorkspace]);

  const activeKey = selectedKey || 'YOUR_API_KEY';
  const scriptUrl = 'http://localhost:3001/api/v1/widget/script.js';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Snippets
  const htmlSnippet = `<!-- Add right before closing </body> tag -->
<script
  src="${scriptUrl}"
  data-api-key="${activeKey}"
  defer>
</script>`;

  const reactSnippet = `import { useEffect } from 'react';

export default function ChatWidget() {
  useEffect(() => {
    // Prevent duplicate script injection
    if (document.getElementById('jagguai-widget-script')) return;

    const script = document.createElement('script');
    script.id = 'jagguai-widget-script';
    script.src = '${scriptUrl}';
    script.setAttribute('data-api-key', '${activeKey}');
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      // Optional cleanup on unmount
      const existing = document.getElementById('jagguai-widget-script');
      if (existing) existing.remove();
    };
  }, []);

  return null;
}`;

  const nextSnippet = `// In app/layout.tsx (App Router) or pages/_app.tsx (Pages Router)
import Script from 'next/script';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Script
          src="${scriptUrl}"
          data-api-key="${activeKey}"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`;

  const vueSnippet = `<template>
  <!-- Widget is injected globally into DOM -->
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

onMounted(() => {
  if (document.getElementById('jagguai-widget-script')) return;

  const script = document.createElement('script');
  script.id = 'jagguai-widget-script';
  script.src = '${scriptUrl}';
  script.setAttribute('data-api-key', '${activeKey}');
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);
});

onUnmounted(() => {
  const existing = document.getElementById('jagguai-widget-script');
  if (existing) existing.remove();
});
</script>`;

  const angularSnippet = `// In your component (e.g. app.component.ts)
import { Component, OnInit, Renderer2, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  constructor(
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    if (this.document.getElementById('jagguai-widget-script')) return;

    const script = this.renderer.createElement('script');
    script.id = 'jagguai-widget-script';
    script.src = '${scriptUrl}';
    script.setAttribute('data-api-key', '${activeKey}');
    script.defer = true;
    this.renderer.appendChild(this.document.body, script);
  }
}`;

  const cmsSnippet = `<!-- WordPress / Shopify / Webflow / Squarespace / Wix Custom HTML / Footer Injection -->
<script
  src="${scriptUrl}"
  data-api-key="${activeKey}"
  defer>
</script>`;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Banner */}
      <div className="glass glass-glow p-5 sm:p-8 rounded-2xl border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Integration &amp; Setup Guide
          </div>
          <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
            How to Integrate jagguAI Bot in Any Client Website
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Follow this complete step-by-step guide to generate workspace API credentials, train your agent on documents, and embed the interactive AI &amp; voice assistant on HTML, React, Next.js, Vue, Angular, or any CMS website.
          </p>
        </div>
      </div>

      {/* Step 1: Generate API Key */}
      <div className="glass p-5 sm:p-8 rounded-2xl border border-white/5 space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-primary to-blue-500 flex items-center justify-center font-bold text-white shadow-lg shadow-primary/20 shrink-0 text-sm">
            1
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Generate Your Workspace API Key</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Each website widget connects securely to a dedicated workspace via a unique API Key.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <span className="text-xs font-bold text-primary block">Step 1.1: Create Workspace</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Create a workspace representing your company, product, or client brand in the top navigation switcher.
            </p>
          </div>
          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <span className="text-xs font-bold text-primary block">Step 1.2: Generate Key</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Go to the <strong>Overview</strong> page, enter a descriptive key name (e.g. <em>Production Web Key</em>), and click <strong>Generate</strong>.
            </p>
          </div>
          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <span className="text-xs font-bold text-primary block">Step 1.3: Save &amp; Select</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Copy the key. Select your active key below to automatically update all integration code snippets on this page!
            </p>
          </div>
        </div>

        {/* Key Selector Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950/60 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-300">Active Workspace Key:</span>
            {keys.length > 0 ? (
              <select
                value={selectedKey}
                onChange={(e) => setSelectedKey(e.target.value)}
                className="bg-slate-900 border border-white/10 text-white rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-primary max-w-xs truncate"
              >
                {keys.map((k) => {
                  const val = k.apiKey || k.keyPlain || k.keyMasked || '';
                  return (
                    <option key={k.id} value={val}>
                      {k.name} ({val})
                    </option>
                  );
                })}
              </select>
            ) : (
              <span className="text-xs text-yellow-400 italic">No key generated yet. Using placeholder.</span>
            )}
          </div>

          <div className="flex items-center gap-2 max-w-full">
            <code className="text-xs text-sky-400 font-mono bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 break-all select-all">
              {activeKey}
            </code>
            <button
              onClick={() => copyToClipboard(activeKey, 'active-key')}
              className="px-3 py-1.5 bg-white/10 hover:bg-primary/20 text-white rounded-lg text-xs border border-white/10 transition-colors shrink-0 flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copiedId === 'active-key' ? '✓ Copied' : 'Copy Key'}
            </button>
          </div>
        </div>
      </div>

      {/* Step 2: Feed Knowledge Base */}
      <div className="glass p-5 sm:p-8 rounded-2xl border border-white/5 space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/20 shrink-0 text-sm">
            2
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Train Your AI on Product Docs &amp; FAQs</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Before embedding the bot, provide context so it gives accurate, instant answers to customer questions.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              File Ingestion
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Upload PDF manuals, DOCX policies, markdown documentation, or plain text files in the <strong>Knowledge Base</strong> tab.
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Automatic Web Crawler
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Input your client documentation URL (e.g. <code>https://docs.acme.com</code>) to recursively crawl and vector-index multiple pages.
            </p>
          </div>

          <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Direct Q&amp;A Pairs
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Log exact answers for refund rules, shipping times, or pricing plans to guarantee strict responses.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Embed Code across Frameworks */}
      <div className="glass p-5 sm:p-8 rounded-2xl border border-white/5 space-y-5 sm:space-y-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-violet-500/20 shrink-0 text-sm">
            3
          </div>
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white">Embed the Chat &amp; Voice Bot in Your Frontend</h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Select your framework below to view the copy-paste integration code.
            </p>
          </div>
        </div>

        {/* Framework Tabs */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-white/10 pb-3">
          {[
            { id: 'html', label: 'HTML / Vanilla JS' },
            { id: 'react', label: 'React.js' },
            { id: 'nextjs', label: 'Next.js' },
            { id: 'vue', label: 'Vue.js / Nuxt' },
            { id: 'angular', label: 'Angular' },
            { id: 'cms', label: 'WordPress / Shopify / Webflow' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground shadow shadow-primary/20'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Active Snippet Display */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-300">
              {activeTab === 'html' && 'Standard HTML 5 Snippet'}
              {activeTab === 'react' && 'React Component with Dynamic Script Injection'}
              {activeTab === 'nextjs' && 'Next.js Script Component Integration'}
              {activeTab === 'vue' && 'Vue 3 Script Setup Integration'}
              {activeTab === 'angular' && 'Angular Component with Renderer2'}
              {activeTab === 'cms' && 'No-Code CMS & E-Commerce Footer Integration'}
            </span>

            <button
              onClick={() => {
                const code =
                  activeTab === 'html'
                    ? htmlSnippet
                    : activeTab === 'react'
                    ? reactSnippet
                    : activeTab === 'nextjs'
                    ? nextSnippet
                    : activeTab === 'vue'
                    ? vueSnippet
                    : activeTab === 'angular'
                    ? angularSnippet
                    : cmsSnippet;
                copyToClipboard(code, 'tab-code');
              }}
              className="px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shadow shadow-primary/20 hover:opacity-90 transition-opacity self-start sm:self-auto"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {copiedId === 'tab-code' ? 'Copied to Clipboard!' : 'Copy Code'}
            </button>
          </div>

          <div className="relative group">
            <pre className="bg-slate-950 p-4 sm:p-5 rounded-2xl border border-white/10 overflow-x-auto text-[11px] sm:text-xs font-mono text-sky-400 leading-relaxed scrollbar-thin scrollbar-thumb-white/10">
              {activeTab === 'html' && htmlSnippet}
              {activeTab === 'react' && reactSnippet}
              {activeTab === 'nextjs' && nextSnippet}
              {activeTab === 'vue' && vueSnippet}
              {activeTab === 'angular' && angularSnippet}
              {activeTab === 'cms' && cmsSnippet}
            </pre>
          </div>

          {/* CMS Specific Instructions */}
          {activeTab === 'cms' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="font-bold text-white block">WordPress</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Go to <strong>Appearance &gt; Theme File Editor</strong> or use a Header/Footer script plugin (e.g. WPCode) and paste the snippet in the <strong>Footer Scripts</strong> section.
                </p>
              </div>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="font-bold text-white block">Shopify</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Go to <strong>Online Store &gt; Themes &gt; Edit Code</strong>, open <code>theme.liquid</code>, and paste right above the closing <code>&lt;/body&gt;</code> tag.
                </p>
              </div>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="font-bold text-white block">Webflow</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Go to <strong>Project Settings &gt; Custom Code</strong>, paste the script into the <strong>Footer Code</strong> box, and publish your site.
                </p>
              </div>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-1.5 text-xs">
                <span className="font-bold text-white block">Wix / Squarespace</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Go to <strong>Settings &gt; Custom Code / Advanced Code Injection</strong>, choose <strong>Body - End</strong>, and paste the code snippet.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step 4: Widget Features & Customization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-5 sm:p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white">🎨 Branding &amp; Styling Customization</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            You can customize the appearance from the <strong>Widget Settings</strong> tab in real time:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Primary Brand Color:</strong> Match your client website color scheme using any hex color code.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Logo &amp; Avatar URL:</strong> Display custom company icons or representative support avatars.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Positioning:</strong> Choose between Bottom-Right and Bottom-Left floating bubbles.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary font-bold">✓</span>
              <span><strong>Default Greetings &amp; Prompt Starters:</strong> Pre-populate common questions for visitors to tap.</span>
            </li>
          </ul>
        </div>

        <div className="glass p-5 sm:p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-white">🎙️ Real-time Voice &amp; Lead Capture</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The embedded bot includes built-in enterprise features:
          </p>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Speech-to-Text &amp; Voice:</strong> Visitors can speak their questions using the microphone toggle.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Lead Capture Gate:</strong> Automatically requests name and email before chats to build CRM leads.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Knowledge Citations:</strong> Displays source links and citations for all answers generated from documents.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 font-bold">✓</span>
              <span><strong>Gap Analysis:</strong> Unanswered queries are flagged in the Overview dashboard so you can fill knowledge gaps.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
