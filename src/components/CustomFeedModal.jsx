import React, { useState } from 'react';
import { X, Link as LinkIcon, Download } from 'lucide-react';

export function CustomFeedModal({ isOpen, onClose, onAddCustomFeed }) {
  const [urlInput, setUrlInput] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    let cleaned = (urlInput || '').trim();
    if (!cleaned) return;
    
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    } else if (cleaned.startsWith('http://')) {
      cleaned = cleaned.replace(/^http:\/\//i, 'https://');
    }

    onAddCustomFeed(cleaned);
    setUrlInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-orange-500" /> Masukkan URL Feed RSS Manual
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Masukkan tautan feed RSS XML dari situs apapun untuk membacanya di KilasFeed:
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 block">Tautan Feed URL:</label>
            <input 
              type="url" 
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              placeholder="https://contoh.com/rss.xml"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button 
              type="submit" 
              className="flex-1 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-600/20"
            >
              <Download className="w-4 h-4" />
              <span>Muat RSS Ini</span>
            </button>
            <button 
              type="button" 
              onClick={onClose} 
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-all"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
