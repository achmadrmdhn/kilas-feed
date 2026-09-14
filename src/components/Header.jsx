import React from 'react';
import { Rss, RefreshCw, Link as LinkIcon, Bookmark, Sun, Moon, Layers, Send } from 'lucide-react';

export function Header({
  onRefresh,
  onOpenCustomFeedModal,
  onOpenTelegramModal,
  onSelectSaved,
  savedCount,
  mediaCount = 0,
  isDark,
  onToggleTheme,
  onGoHome
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Branding */}
          <div 
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0" 
            onClick={onGoHome}
            title="Kembali ke Beranda KilasFeed"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-orange-500 to-brand-600 text-white flex items-center justify-center font-black text-base sm:text-lg shadow-md shadow-brand-600/30 transition-transform group-hover:scale-105">
              <Rss className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  KilasFeed
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 rounded-full items-center gap-1">
                  <Layers className="w-3 h-3" /> {mediaCount} Media
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
                Agregator RSS Berita Nasional & Finansial Indonesia
              </p>
            </div>
          </div>

          {/* Action Tools & Theme Toggle */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5">
            <button 
              onClick={onRefresh} 
              title="Muat Ulang Berita" 
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium active:scale-95"
            >
              <RefreshCw className="w-4 h-4 text-brand-600 shrink-0" />
              <span className="hidden md:inline">Segarkan</span>
            </button>
            
            <button 
              onClick={onOpenCustomFeedModal} 
              title="Kustom URL RSS Manual" 
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs sm:text-sm font-medium flex items-center gap-1.5 active:scale-95"
            >
              <LinkIcon className="w-4 h-4 text-orange-500 shrink-0" />
              <span className="hidden md:inline">URL Kustom</span>
            </button>

            <button 
              onClick={onOpenTelegramModal} 
              title="Pengaturan Telegram Bot Manual" 
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs sm:text-sm font-medium flex items-center gap-1.5 active:scale-95"
            >
              <Send className="w-4 h-4 text-sky-500 shrink-0" />
              <span className="hidden md:inline">Bot Telegram</span>
            </button>

            <button 
              onClick={onSelectSaved} 
              title="Berita Tersimpan (Favorit)" 
              className="p-2 sm:px-3 sm:py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all text-xs sm:text-sm font-medium flex items-center gap-1.5 relative active:scale-95"
            >
              <Bookmark className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
              <span className="hidden md:inline">Favorit</span>
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold rounded-full bg-amber-500 text-white min-w-[18px] text-center">
                {savedCount}
              </span>
            </button>

            <button 
              onClick={onToggleTheme} 
              title="Ganti Tema (Gelap / Terang)" 
              className="p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all active:scale-95 shrink-0"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
