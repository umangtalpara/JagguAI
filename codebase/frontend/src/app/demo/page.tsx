'use client';

import { useEffect } from 'react';

export default function StandaloneClientDemo() {
  useEffect(() => {
    // Dynamically inject the widget script onto the standalone test page
    if (document.getElementById('jagguai-widget-script')) return;

    const script = document.createElement('script');
    script.id = 'jagguai-widget-script';
    script.src = 'https://jagguai.onrender.com/api/v1/widget/script.js';
    script.setAttribute('data-api-key', 'jaggu_live_c94c1157110b19a2cc57fbca09aafdee03b781414944174a');
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      const el = document.getElementById('jagguai-widget-script');
      if (el) el.remove();
      const bubble = document.getElementById('jaggu-chat-bubble');
      if (bubble) bubble.remove();
      const container = document.getElementById('jaggu-chat-container');
      if (container) container.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-200 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Testing Sandbox Status Bar */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-indigo-950/90 via-slate-900/90 to-slate-950/90 border-b border-indigo-500/20 backdrop-blur-md px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <span className="bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded font-bold uppercase tracking-wider text-[10px]">
            Third-Party Website Simulator
          </span>
          <span className="text-slate-300">
            Standalone sandbox simulating an external client web app running the live embedded bot script.
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Active Key:</span>
          <code className="bg-black/50 text-cyan-300 px-2 py-0.5 rounded border border-white/10 font-mono text-[11px]">
            jaggu_live_c94c1157110b19a2cc57fbca09aafdee03b781414944174a
          </code>
        </div>
      </header>

      {/* Client Website Nav */}
      <nav className="max-w-6xl mx-auto w-full px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 font-extrabold text-xl text-white">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center text-white text-sm shadow-md shadow-indigo-500/20">
            ⚡
          </div>
          <span>Acme Enterprise</span>
        </div>
        <div className="hidden sm:flex items-center gap-6 text-sm font-medium text-slate-400">
          <a href="#services" className="hover:text-white transition-colors">Services</a>
          <a href="#solutions" className="hover:text-white transition-colors">Solutions</a>
          <a href="#case-studies" className="hover:text-white transition-colors">Case Studies</a>
          <a href="#contact" className="hover:text-white transition-colors">Contact</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-5xl mx-auto w-full px-6 pt-16 pb-12 text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
          ✨ 24/7 AI-Powered Support Assistant Active Below
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Scalable Cloud Software &amp;{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
            Engineering Excellence
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          We build enterprise-grade software products and cloud solutions for modern companies. Tap the floating chat bubble in the bottom right corner to test live AI support, voice inputs, and real-time streaming!
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <a
            href="#services"
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
          >
            Explore Services
          </a>
          <a
            href="#contact"
            className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Get in Touch
          </a>
        </div>
      </main>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto w-full px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6" id="services">
        <div className="p-7 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <div className="h-11 w-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center text-xl">
            🚀
          </div>
          <h2 className="text-lg font-bold text-white">Custom Software Engineering</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            High-performance full-stack web and cloud applications architected to scale seamlessly with your growth.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <div className="h-11 w-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center text-xl">
            🤖
          </div>
          <h2 className="text-lg font-bold text-white">AI Agents &amp; Automation</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Context-aware conversational agents and RAG vector search trained on your proprietary documentation.
          </p>
        </div>

        <div className="p-7 rounded-2xl bg-slate-900/60 border border-white/10 space-y-3">
          <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center text-xl">
            ☁️
          </div>
          <h2 className="text-lg font-bold text-white">Cloud &amp; DevOps</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            Automated CI/CD pipelines, container orchestration, and zero-downtime multi-cloud deployments.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 py-6 px-6 text-center text-xs text-slate-500">
        &copy; 2026 Acme Enterprise Solutions. Integrated with jagguAI Support Widget.
      </footer>
    </div>
  );
}
