import { useState, useEffect } from 'react';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('kilasfeed_bookmarks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('kilasfeed_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const isBookmarked = (id) => {
    return bookmarks.some(item => item.id === id || item.link === id);
  };

  const toggleBookmark = (item) => {
    if (!item) return false;
    const exists = isBookmarked(item.id);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.id !== item.id && b.link !== item.link));
      return false; // Removed
    } else {
      setBookmarks(prev => [item, ...prev]);
      return true; // Added
    }
  };

  return { bookmarks, isBookmarked, toggleBookmark };
}
