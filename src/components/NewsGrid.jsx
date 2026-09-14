import React, { useState, useEffect } from 'react';
import { Search, Newspaper, AlertTriangle, RefreshCw, ExternalLink, Compass, ChevronLeft, ChevronRight, Layers, ArrowDown } from 'lucide-react';
import { NewsCard } from './NewsCard';

const PAGE_SIZE = 18;

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
  onOpenModal,
  onRequireTelegramConfig
}) {
  const [navMode, setNavMode] = useState('loadMore'); // 'loadMore' | 'pages'
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination state when articles change (e.g. channel or search changes)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setCurrentPage(1);
  }, [articles]);

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
        </div>
      </div>
    );
  }

  // Pagination Calculations
  const totalItems = articles.length;
  const totalPages = Math.ceil(totalItems / PAGE_SIZE);

  let displayedArticles = [];
  if (navMode === 'loadMore') {
    displayedArticles = articles.slice(0, visibleCount);
  } else {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    displayedArticles = articles.slice(startIndex, startIndex + PAGE_SIZE);
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 350, behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + PAGE_SIZE, totalItems));
  };

  return (
    <div>
      {/* Header Info Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-brand-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Daftar Berita</h2>
        </div>

        {/* Navigation Mode Switcher */}
        <div className="flex items-center gap-2 text-xs bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80 self-start sm:self-auto">
          <button
            onClick={() => setNavMode('loadMore')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              navMode === 'loadMore'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ArrowDown className="w-3 h-3" />
            <span>Muat Bertahap</span>
          </button>

          <button
            onClick={() => setNavMode('pages')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-colors flex items-center gap-1 ${
              navMode === 'pages'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Nomor Halaman</span>
          </button>
        </div>
      </div>

      {/* Grid of Articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedArticles.map(article => (
          <NewsCard 
            key={article.id} 
            article={article} 
            isBookmarked={isBookmarkedFn(article.id)} 
            onToggleBookmark={onToggleBookmark} 
            onOpenModal={onOpenModal} 
            onRequireTelegramConfig={onRequireTelegramConfig}
          />
        ))}
      </div>

      {/* Hybrid Pagination Footer Controls */}
      <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col items-center gap-4">
        
        {/* MODE 1: Load More Button */}
        {navMode === 'loadMore' && (
          <div className="w-full max-w-md text-center space-y-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Menampilkan <strong className="text-slate-800 dark:text-slate-200">{displayedArticles.length}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> berita
            </div>

            {/* Subtle Progress Bar */}
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-brand-600 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (displayedArticles.length / totalItems) * 100)}%` }}
              ></div>
            </div>

            {displayedArticles.length < totalItems ? (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-800 dark:text-slate-100 font-bold text-xs sm:text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <ArrowDown className="w-4 h-4 text-brand-600 animate-bounce" />
                <span>Muat {Math.min(PAGE_SIZE, totalItems - displayedArticles.length)} Berita Lainnya</span>
              </button>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic pt-2">
                🎉 Seluruh {totalItems} berita telah ditampilkan.
              </p>
            )}
          </div>
        )}

        {/* MODE 2: Page Numbers (1, 2, 3...) */}
        {navMode === 'pages' && (
          <div className="flex flex-col items-center gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Halaman <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> dari <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong> ({totalItems} total berita)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                .map((page, idx, arr) => {
                  const prevPage = arr[idx - 1];
                  const showEllipsis = prevPage && page - prevPage > 1;
                  const isCurrent = page === currentPage;

                  return (
                    <React.Fragment key={page}>
                      {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                          isCurrent
                            ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                })}

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
