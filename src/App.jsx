import React, { useState, useEffect, useMemo } from 'react';
import { RSS_FEEDS as INITIAL_FEEDS } from './data/feeds';
import { useTheme } from './hooks/useTheme';
import { useBookmarks } from './hooks/useBookmarks';
import { useRssFeed } from './hooks/useRssFeed';

import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { SearchBar } from './components/SearchBar';
import { HeadlineArticle } from './components/HeadlineArticle';
import { NewsGrid } from './components/NewsGrid';
import { DetailModal } from './components/DetailModal';
import { CustomFeedModal } from './components/CustomFeedModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

export default function App() {
  const [feedsList, setFeedsList] = useState(INITIAL_FEEDS);
  const [currentFeedIndex, setCurrentFeedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('semua');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  const [activeModalArticle, setActiveModalArticle] = useState(null);
  const [isCustomFeedModalOpen, setIsCustomFeedModalOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const { isDark, toggleTheme } = useTheme();
  const { bookmarks, isBookmarked, toggleBookmark } = useBookmarks();
  const { items, loading, proxyMode, lastUpdated, feedTitle, fetchFeed } = useRssFeed();

  // Show Toast helper
  const showToast = (message, type = 'info') => {
    setToast({ message, type });
  };

  const handleCloseToast = () => {
    setToast({ message: '', type: 'info' });
  };

  // Fetch Feed when index or feeds change
  useEffect(() => {
    if (activeCategory === 'saved') return;
    const feed = feedsList[currentFeedIndex];
    if (feed) {
      showToast(`Mengambil feed dari ${feed.name}...`, 'info');
      fetchFeed(feed).then((res) => {
        if (res && res.success) {
          showToast(`Berhasil memuat ${res.count} berita dari ${feed.name}`, 'success');
        } else {
          showToast(`Akses feed ${feed.name} dibatasi oleh server sumber`, 'error');
        }
      });
    }
  }, [currentFeedIndex, feedsList, activeCategory, fetchFeed]);

  // Handle Category selection
  const handleSelectCategory = (category) => {
    setActiveCategory(category);
    if (category === 'saved') {
      showToast(`Menampilkan ${bookmarks.length} berita tersimpan`, 'info');
    } else {
      const currentFeed = feedsList[currentFeedIndex];
      if (category !== 'semua' && currentFeed.category !== category) {
        const matchIdx = feedsList.findIndex(f => f.category === category);
        if (matchIdx >= 0) setCurrentFeedIndex(matchIdx);
      }
    }
  };

  // Handle Feed Index selection
  const handleSelectFeedIndex = (idx) => {
    if (idx < 0 || idx >= feedsList.length) return;
    if (activeCategory === 'saved') setActiveCategory('semua');
    setCurrentFeedIndex(idx);
  };

  // Refresh current feed
  const handleRefresh = () => {
    if (activeCategory === 'saved') {
      showToast('Daftar simpanan diperbarui', 'success');
    } else {
      const feed = feedsList[currentFeedIndex];
      if (feed) {
        showToast(`Memuat ulang feed ${feed.name}...`, 'info');
        fetchFeed(feed, true).then((res) => {
          if (res && res.success) {
            showToast(`Feed ${feed.name} diperbarui!`, 'success');
          } else {
            showToast(`Gagal memuat feed ${feed.name}`, 'error');
          }
        });
      }
    }
  };

  // Add custom feed
  const handleAddCustomFeed = (url) => {
    let domainName = "Feed Kustom";
    try {
      domainName = new URL(url).hostname.replace("www.", "");
    } catch (e) {}

    const newFeed = {
      id: `custom-${Date.now()}`,
      name: `Kustom – ${domainName}`,
      url: url,
      category: "nasional",
      icon: "fa-rss",
      color: "#f97316"
    };

    setFeedsList(prev => [newFeed, ...prev]);
    setCurrentFeedIndex(0);
    if (activeCategory === 'saved') setActiveCategory('semua');
    showToast(`Berhasil menambahkan feed ${newFeed.name}`, 'success');
  };

  // Toggle Bookmark wrapper with Toast feedback
  const handleToggleBookmark = (article) => {
    const isAdded = toggleBookmark(article);
    if (isAdded) {
      showToast("Berita disimpan ke Favorit!", "success");
    } else {
      showToast("Berita dihapus dari Simpanan", "info");
    }
  };

  // Filtered & Sorted News list calculation
  const displayedArticles = useMemo(() => {
    let baseList = activeCategory === 'saved' ? bookmarks : items;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      baseList = baseList.filter(item => 
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    const result = [...baseList];
    if (sortOption === 'newest') {
      result.sort((a, b) => b.timestamp - a.timestamp);
    } else if (sortOption === 'oldest') {
      result.sort((a, b) => a.timestamp - b.timestamp);
    } else if (sortOption === 'title') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [items, bookmarks, activeCategory, searchQuery, sortOption]);

  const currentFeedObj = feedsList[currentFeedIndex] || feedsList[0];
  const headlineArticle = !searchQuery && activeCategory !== 'saved' && displayedArticles.length > 0
    ? displayedArticles[0]
    : null;

  const gridArticles = headlineArticle ? displayedArticles.slice(1) : displayedArticles;

  return (
    <div className="bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 min-h-screen flex flex-col antialiased transition-colors duration-200">
      
      {/* Navigation Header */}
      <Header
        onRefresh={handleRefresh}
        onOpenCustomFeedModal={() => setIsCustomFeedModalOpen(true)}
        onSelectSaved={() => handleSelectCategory('saved')}
        savedCount={bookmarks.length}
        mediaCount={feedsList.length}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onGoHome={() => {
          setActiveCategory('semua');
          setCurrentFeedIndex(0);
        }}
      />

      {/* Category Bar & Quick Chips */}
      <CategoryNav
        feeds={feedsList}
        currentFeedIndex={currentFeedIndex}
        activeCategory={activeCategory}
        onSelectFeedIndex={handleSelectFeedIndex}
        onSelectCategory={handleSelectCategory}
      />

      {/* Main Content Body */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Search & Metadata Bar */}
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onClearSearch={() => setSearchQuery('')}
          sortOption={sortOption}
          onSortChange={setSortOption}
          itemCount={displayedArticles.length}
          sourceTitle={activeCategory === 'saved' ? "Artikel Tersimpan (Favorit)" : (feedTitle || currentFeedObj.name)}
          lastBuildDate={lastUpdated}
          proxyMode={activeCategory === 'saved' ? "Storage" : proxyMode}
          originalUrl={currentFeedObj.url}
        />

        {/* Status Toast */}
        <Toast toast={toast} onClose={handleCloseToast} />

        {/* Headline Article */}
        {!loading && headlineArticle && (
          <HeadlineArticle
            article={headlineArticle}
            isBookmarked={isBookmarked(headlineArticle.id)}
            onToggleBookmark={handleToggleBookmark}
            onOpenModal={setActiveModalArticle}
          />
        )}

        {/* Grid of Articles */}
        <NewsGrid
          articles={gridArticles}
          loading={loading}
          searchQuery={searchQuery}
          sourceTitle={activeCategory === 'saved' ? "Tersimpan" : (feedTitle || currentFeedObj.name)}
          originalUrl={currentFeedObj.url}
          onRefresh={handleRefresh}
          onSelectDefaultFeed={() => {
            setActiveCategory('semua');
            setCurrentFeedIndex(0);
          }}
          onResetSearch={() => setSearchQuery('')}
          isBookmarkedFn={isBookmarked}
          onToggleBookmark={handleToggleBookmark}
          onOpenModal={setActiveModalArticle}
        />
      </main>

      {/* Detail Reader Modal */}
      <DetailModal
        article={activeModalArticle}
        isOpen={Boolean(activeModalArticle)}
        onClose={() => setActiveModalArticle(null)}
        isBookmarked={activeModalArticle ? isBookmarked(activeModalArticle.id) : false}
        onToggleBookmark={handleToggleBookmark}
        onShowToast={showToast}
      />

      {/* Custom RSS URL Modal */}
      <CustomFeedModal
        isOpen={isCustomFeedModalOpen}
        onClose={() => setIsCustomFeedModalOpen(false)}
        onAddCustomFeed={handleAddCustomFeed}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
