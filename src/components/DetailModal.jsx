import React, { useState } from 'react';
import { X, Clock, Bookmark, Copy, Check, ExternalLink, Newspaper, Send } from 'lucide-react';
import { formatDateIndo } from '../hooks/useRssFeed';
import { sendNewsToTelegram } from '../services/telegramService';

export function DetailModal({ article, isOpen, onClose, isBookmarked, onToggleBookmark, onShowToast, onRequireTelegramConfig }) {
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [sendingTelegram, setSendingTelegram] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState(null);

  if (!isOpen || !article) return null;

  const hasImage = article.image && article.image.startsWith('http') && !imgError;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.link).then(() => {
      setCopied(true);
      if (onShowToast) onShowToast("Tautan berita berhasil disalin", "success");
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      if (onShowToast) onShowToast("Gagal menyalin tautan", "error");
    });
  };

  const handleSendTelegram = async () => {
    setSendingTelegram(true);
    setTelegramStatus(null);

    const res = await sendNewsToTelegram(article);
    setSendingTelegram(false);

    if (res.success) {
      setTelegramStatus('sent');
      if (onShowToast) onShowToast("Berita berhasil dikirim ke Bot Telegram!", "success");
      setTimeout(() => setTelegramStatus(null), 3000);
    } else {
      if (res.error && res.error.includes('Pengaturan Telegram Bot Token')) {
        if (onRequireTelegramConfig) onRequireTelegramConfig();
      } else {
        if (onShowToast) onShowToast(`Gagal: ${res.error}`, "error");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 transform transition-transform animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header Image */}
        <div className="relative">
          <div className="w-full h-56 sm:h-64 bg-slate-100 dark:bg-slate-800 overflow-hidden relative flex items-center justify-center">
            {hasImage ? (
              <>
                <img 
                  src={article.image} 
                  alt={article.title} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={() => setImgError(true)} 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-950 dark:to-black p-6 flex flex-col items-center justify-center text-center relative transition-colors">
                <Newspaper className="w-12 h-12 text-brand-600 dark:text-brand-400 mb-2 animate-pulse" />
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">Pratinjau Foto Tidak Tersedia</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
                  Berita dari {article.category || 'sumber media'}
                </span>
              </div>
            )}

            <button 
              onClick={onClose} 
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-brand-600" />
              {formatDateIndo(article.pubDate)}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-semibold text-[11px]">
              {article.category || "RSS Feed"}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
            {article.title}
          </h2>

          {article.caption && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border-l-4 border-brand-600 text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
              <span>{article.caption}</span>
            </div>
          )}

          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pt-2">
            {article.description || "Ulasan artikel berita selengkapnya dapat Anda baca secara langsung di halaman sumber berita resmi."}
          </p>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button 
                onClick={() => onToggleBookmark(article)} 
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all"
              >
                <Bookmark className={`w-4 h-4 ${isBookmarked ? 'text-amber-500 fill-amber-500' : ''}`} />
                <span>{isBookmarked ? 'Tersimpan' : 'Simpan'}</span>
              </button>

              <button 
                onClick={handleSendTelegram}
                disabled={sendingTelegram}
                className={`px-4 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  telegramStatus === 'sent'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300'
                }`}
              >
                <Send className="w-4 h-4 text-sky-500" />
                <span>{telegramStatus === 'sent' ? 'Terkirim ke Bot' : sendingTelegram ? 'Mengirim...' : 'Kirim Telegram'}</span>
              </button>

              <button 
                onClick={handleCopyLink} 
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-2 transition-all"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Tautan Disalin!' : 'Salin Tautan'}</span>
              </button>
            </div>

            <a 
              href={article.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-600/30 transition-all"
            >
              <span>Buka Artikel Sumber Asli</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
