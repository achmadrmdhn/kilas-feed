import React from 'react';
import { Rss, Coffee, Heart, Github } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-brand-600 text-white flex items-center justify-center font-bold">
            <Rss className="w-3 h-3 text-white" />
          </div>
          <span className="font-bold text-slate-800 dark:text-slate-200">KilasFeed</span>
          <span>© {currentYear} • Agregator Berita Indonesia</span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span>Dibuat dengan</span>
          <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 inline" />
          <span>dan</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline animate-pulse" />
          <span>oleh</span>
          <a
            href="https://github.com/achmadrmdhn"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 underline underline-offset-4 decoration-brand-500/40 hover:decoration-brand-500 transition-colors"
          >
            <Github className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
            <span>achmadrmdhn</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
