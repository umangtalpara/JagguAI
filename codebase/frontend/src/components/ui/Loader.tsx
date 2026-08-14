import React from 'react';

// Inline spinner for buttons/submitting states
export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <div
      className={`border-2 border-current border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
    />
  );
}

// Full page loader overlay with glassmorphic blur and centering
export function PageLoader({ text = 'Processing request...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99999] flex flex-col items-center justify-center gap-4 animate-fade-in">
      <div className="relative flex items-center justify-center">
        <div className="h-16 w-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="absolute h-10 w-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin animate-reverse" />
      </div>
      <span className="text-sm font-semibold text-white tracking-wider animate-pulse">{text}</span>
    </div>
  );
}

// Pulsing loading skeleton for cards or list items
export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return (
    <div
      className={`bg-white/5 rounded-lg animate-pulse ${className}`}
    />
  );
}

// Card skeleton template for overview cards
export function CardSkeleton() {
  return (
    <div className="glass p-6 rounded-2xl border border-white/5 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
