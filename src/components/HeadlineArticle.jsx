import React, { useState } from 'react';
import { Clock, ArrowRight, ExternalLink, Bookmark, Newspaper, Send, Check } from 'lucide-react';
import { formatDateIndo } from '../hooks/useRssFeed';
import { sendNewsToTelegram } from '../services/telegramService';

export function HeadlineArticle({ article, isBookmarked, onToggleBookmark, onOpenModal, onRequireTelegramConfig }) {
  const [imgError, setImgError] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);

  if (!article) return null;

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
    <div className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <span className="w-3 h-3 bg-brand-600 rounded-full animate-ping"></span>
        <h2 className="text-lg font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Berita Utama</h2>
      </div>
      
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all duration-300">
        <div 
          className="grid grid-cols-1 lg:grid-cols-12 gap-0 group cursor-pointer"
          onClick={() => onOpenModal(article)}
        >
          <div className="lg:col-span-7 relative h-64 sm:h-80 lg:h-[380px] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            {hasImage ? (
              <img 
                src={article.image} 
                alt={article.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black p-6 flex flex-col items-center justify-center text-center relative transition-colors">
                <Newspaper className="w-12 h-12 text-brand-600 dark:text-brand-400 mb-2 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Pratinjau Foto Tidak Tersedia</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                  Klik untuk membaca berita utama dari {article.category || 'sumber media'}
                </span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent lg:hidden"></div>
            
            <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-600 text-white shadow-md z-10">
              {article.category}
            </span>

            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(article);
              }}
              className={`absolute top-4 right-4 w-9 h-9 rounded-full ${
                isBookmarked ? 'bg-amber-500 text-white' : 'bg-black/40 text-white hover:bg-black/60'
              } flex items-center justify-center backdrop-blur-md transition-all shadow-md z-10`}
              title={isBookmarked ? 'Hapus Simpanan' : 'Simpan Berita'}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          </div>

          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Clock className="w-3.5 h-3.5 text-brand-600" />
                <span>{formatDateIndo(article.pubDate)}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                {article.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {article.description || article.caption || 'Klik untuk membaca selengkapnya ulasan berita utama ini.'}
              </p>
            </div>
            
            <div className="pt-6 flex items-center justify-between">
              <span className="text-xs font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                Baca Kilat <ArrowRight className="w-3 h-3" />
              </span>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleSendTelegram}
                  disabled={sendingTelegram}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    telegramStatus === 'sent'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-sky-50 text-sky-600 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-400'
                  }`}
                >
                  {telegramStatus === 'sent' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Terkirim</span>
                    </>
                  ) : sendingTelegram ? (
                    <span className="animate-pulse">Mengirim...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-sky-500" />
                      <span>Kirim Telegram</span>
                    </>
                  )}
                </button>

                <a 
                  href={article.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="p-2 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
                  title="Buka artikel asli di tab baru"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
