import React, { useState } from 'react';
import { Clock, ChevronRight, ExternalLink, Bookmark, Newspaper, Send, Check } from 'lucide-react';
import { formatDateIndo } from '../hooks/useRssFeed';
import { sendNewsToTelegram } from '../services/telegramService';

export function NewsCard({ article, isBookmarked, onToggleBookmark, onOpenModal, onRequireTelegramConfig }) {
  const [imgError, setImgError] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null); // 'sent' | 'error'

  const hasImage = article.image && article.image.startsWith('http') && !imgError;

  const handleSendTelegram = async (e) => {
    e.stopPropagation();
    setSendingTelegram(true);
    setTelegramStatus(null);

    const res = await sendNewsToTelegram(article);
    setSendingTelegram(false);

    if (res.success) {
      setTelegramStatus('sent');
      setTimeout(() => setTelegramStatus(null), 3000);
    } else {
      if (res.error && res.error.includes('Pengaturan Telegram Bot Token')) {
        if (onRequireTelegramConfig) onRequireTelegramConfig();
      } else {
        alert(`Gagal mengirim ke Telegram: ${res.error}`);
      }
    }
  };

  return (
    <article 
      className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col cursor-pointer group hover:-translate-y-1 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200"
      onClick={() => onOpenModal(article)}
    >
      <div className="relative h-48 w-full bg-slate-100 dark:bg-slate-800/90 overflow-hidden flex items-center justify-center">
        {hasImage ? (
          <img 
            src={article.image} 
            alt={article.title} 
            loading="lazy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black p-4 flex flex-col items-center justify-center text-center relative transition-colors">
            <Newspaper className="w-9 h-9 text-brand-600 dark:text-brand-400 mb-1.5 animate-pulse" />
            <span className="text-xs font-bold text-slate-900 dark:text-white tracking-wide">Pratinjau Foto Tidak Tersedia</span>
            <span className="text-[10px] text-slate-600 dark:text-slate-400 mt-1 max-w-[200px] leading-tight">
              Klik untuk membaca berita dari {article.category || 'sumber media'}
            </span>
          </div>
        )}

        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-white shadow-sm z-10">
          {article.category}
        </span>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onToggleBookmark(article);
          }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full ${
            isBookmarked ? 'bg-amber-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
          } flex items-center justify-center backdrop-blur-md transition-all shadow-sm z-10`}
          title={isBookmarked ? 'Hapus Simpanan' : 'Simpan Berita'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
        </button>
      </div>

      <div className="p-5 flex flex-col flex-grow justify-between">
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Clock className="w-3 h-3 text-brand-600" />
            <span>{formatDateIndo(article.pubDate)}</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
            {article.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {article.description || article.caption || 'Simak ulasan lengkap artikel berita ini langsung di KilasFeed.'}
          </p>
        </div>

        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <span className="font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            Baca Kilat <ChevronRight className="w-3 h-3" />
          </span>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={handleSendTelegram}
              disabled={sendingTelegram}
              title="Kirim ke Bot Telegram"
              className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
                telegramStatus === 'sent'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-400 dark:hover:bg-sky-900/60'
              }`}
            >
              {telegramStatus === 'sent' ? (
                <>
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Terkirim</span>
                </>
              ) : sendingTelegram ? (
                <span className="animate-pulse">Mengirim...</span>
              ) : (
                <>
                  <Send className="w-3 h-3 text-sky-500" />
                  <span className="hidden sm:inline">Kirim Telegram</span>
                </>
              )}
            </button>

            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors p-1"
              title="Buka artikel sumber asli"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
