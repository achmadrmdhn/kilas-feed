import React from 'react';
import { Search, X, ExternalLink } from 'lucide-react';

export function SearchBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  sortOption,
  onSortChange,
  itemCount,
  sourceTitle,
  lastBuildDate,
  proxyMode,
  originalUrl
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Input Pencarian */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari kata kunci atau judul berita..." 
            className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
          {searchQuery && (
            <button 
              onClick={onClearSearch} 
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter & Sorting */}
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={sortOption} 
            onChange={(e) => onSortChange(e.target.value)} 
            className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="newest">Terbaru Dulu</option>
            <option value="oldest">Terlama Dulu</option>
            <option value="title">Urutkan Abjad (A-Z)</option>
          </select>

          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 border border-brand-200 dark:border-brand-900">
            {itemCount} Berita
          </span>
        </div>
      </div>

      {/* Feed Status Info */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
        <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
          <span className="truncate">Sumber Aktif: <strong className="text-slate-800 dark:text-slate-200 font-bold">{sourceTitle}</strong></span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline">Pembaruan: {lastBuildDate || "Baru saja"}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
            {proxyMode}
          </span>
          <a 
            href={originalUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="hover:text-brand-600 dark:hover:text-brand-400 flex items-center gap-1 font-semibold transition-colors"
          >
            Buka File RSS Asli <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
