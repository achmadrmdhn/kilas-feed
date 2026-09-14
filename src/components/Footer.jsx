import React from 'react';
import { Rss, ShieldCheck } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-800 dark:text-slate-200">KilasFeed</span>
          <span>• Agregator RSS Indonesia & Finansial Indonesia</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <Rss className="w-3.5 h-3.5 text-orange-500" /> Multi-Feed React App
          </span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Auto Proxy CORS
          </span>
        </div>
      </div>
    </footer>
  );
}
