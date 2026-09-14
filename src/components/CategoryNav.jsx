import React from 'react';
import { Newspaper, Bookmark } from 'lucide-react';

export function CategoryNav({
  feeds,
  currentFeedIndex,
  activeCategory,
  onSelectFeedIndex,
  onSelectCategory
}) {
  const groups = {
    nasional: { label: "Nasional & Terkini", items: [] },
    ekonomi: { label: "Ekonomi, Finansial & Bisnis", items: [] },
    fitur: { label: "Gaya Hidup & Khusus", items: [] }
  };

  feeds.forEach((feed, idx) => {
    if (groups[feed.category]) {
      groups[feed.category].items.push({ ...feed, originalIdx: idx });
    }
  });

  const filteredChips = activeCategory === "semua" || activeCategory === "saved"
    ? feeds
    : feeds.filter(f => f.category === activeCategory);

  const categoryTabs = [
    { id: 'semua', label: `Semua (${feeds.length})` },
    ...(groups.nasional.items.length > 0 ? [{ id: 'nasional', label: 'Nasional' }] : []),
    ...(groups.ekonomi.items.length > 0 ? [{ id: 'ekonomi', label: 'Ekonomi & Bisnis' }] : []),
    ...(groups.fitur.items.length > 0 ? [{ id: 'fitur', label: 'Populer & Khusus' }] : []),
  ];

  return (
    <section className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 py-3">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Dropdown Selector RSS */}
          <div className="flex items-center gap-2 flex-1">
            <label htmlFor="feedSelector" className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap flex items-center gap-1.5">
              <Newspaper className="w-4 h-4 text-brand-600" /> Pilih Kanal:
            </label>
            <div className="relative flex-1 max-w-md">
              <select 
                id="feedSelector" 
                value={currentFeedIndex}
                onChange={(e) => onSelectFeedIndex(parseInt(e.target.value, 10))} 
                className="w-full pl-3 pr-8 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm transition-all truncate cursor-pointer"
              >
                {Object.entries(groups)
                  .filter(([_, group]) => group.items.length > 0)
                  .map(([catKey, group]) => (
                    <optgroup key={catKey} label={group.label}>
                      {group.items.map(item => (
                        <option key={item.id} value={item.originalIdx}>
                          {item.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
              </select>
            </div>
          </div>

          {/* Kategori Filter Tab Cepat */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px] mr-1 hidden sm:inline">Kategori:</span>
            
            {categoryTabs.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => onSelectCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                    isActive 
                      ? 'bg-brand-600 text-white shadow-sm' 
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500'
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}

            <button
              onClick={() => onSelectCategory('saved')}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                activeCategory === 'saved'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-700/60 hover:border-amber-500'
              }`}
            >
              <Bookmark className="w-3 h-3" /> Tersimpan
            </button>
          </div>

        </div>

        {/* Quick Media Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-3 pb-1">
          {filteredChips.map(feed => {
            const origIdx = feeds.findIndex(f => f.id === feed.id);
            const isActive = origIdx === currentFeedIndex && activeCategory !== 'saved';
            return (
              <button
                key={feed.id}
                onClick={() => {
                  if (activeCategory === 'saved') onSelectCategory('semua');
                  onSelectFeedIndex(origIdx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive 
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm" 
                    : "bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-brand-500"
                }`}
              >
                <i className={`fa-solid ${feed.icon || 'fa-rss'} text-[11px] ${isActive ? 'text-orange-400' : 'text-slate-400'}`}></i>
                <span>{feed.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
