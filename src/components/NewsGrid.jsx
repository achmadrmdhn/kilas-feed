import React from 'react';
import { Search, Newspaper, AlertTriangle, RefreshCw, ExternalLink, Compass } from 'lucide-react';
import { NewsCard } from './NewsCard';

export function NewsGrid({
  articles,
  loading,
  searchQuery,
  sourceTitle,
  originalUrl,
  onRefresh,
  onSelectDefaultFeed,
  onResetSearch,
  isBookmarkedFn,
  onToggleBookmark,
  onOpenModal
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 h-64 flex flex-col justify-end space-y-3">
          <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded w-1/4"></div>
          <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="bg-slate-200 dark:bg-slate-800 h-44 rounded-xl"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
              <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-full"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Case 1: Search yielded 0 results
  if (articles.length === 0 && searchQuery) {
    return (
      <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 my-6 animate-fade-in">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">Tidak ada berita yang cocok</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
          Tidak ditemukan berita dengan kata kunci "{searchQuery}".
        </p>
        <button 
          onClick={onResetSearch} 
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
        >
          Reset Pencarian
        </button>
      </div>
    );
  }

  // Case 2: Feed failed to load or has 0 items
  if (articles.length === 0) {
    return (
      <div className="py-14 px-6 sm:px-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-2xl mx-auto my-6 animate-fade-in space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 flex items-center justify-center text-amber-500 shadow-sm">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
            Berita dari <span className="text-brand-600 dark:text-brand-400">{sourceTitle}</span> Belum Tersedia
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg mx-auto">
            Saat ini berita dari {sourceTitle} sedang tidak dapat dimuat. Anda bisa mencoba muat ulang atau memilih kanal berita lainnya.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button 
            onClick={onRefresh}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-md shadow-brand-600/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Coba Muat Ulang</span>
          </button>

          <button 
            onClick={onSelectDefaultFeed}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <Compass className="w-4 h-4 text-brand-600" />
            <span>Pilih Kanal Lain</span>
          </button>

          <a 
            href={originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <span>Buka Sumber Asli</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Berita</h2>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Menampilkan {articles.length} berita
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map(article => (
          <NewsCard 
            key={article.id} 
            article={article} 
            isBookmarked={isBookmarkedFn(article.id)} 
            onToggleBookmark={onToggleBookmark} 
            onOpenModal={onOpenModal} 
          />
        ))}
      </div>
    </div>
  );
}
