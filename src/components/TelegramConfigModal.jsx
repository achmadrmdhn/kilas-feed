import React, { useState, useEffect } from 'react';
import { Send, Key, MessageSquare, CheckCircle, AlertCircle, X, ExternalLink, HelpCircle, RotateCcw } from 'lucide-react';
import { getTelegramConfig, saveTelegramConfig, testTelegramConnection } from '../services/telegramService';

export default function TelegramConfigModal({ isOpen, onClose, onSaved }) {
  const [token, setToken] = useState('');
  const [chatId, setChatId] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // { type: 'success'|'error', msg: string }

  useEffect(() => {
    if (isOpen) {
      const config = getTelegramConfig();
      setToken(config.token);
      setChatId(config.chatId);
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!token || !chatId) {
      setStatus({ type: 'error', msg: 'Harap isi Bot Token dan Chat ID terlebih dahulu.' });
      return;
    }
    setTesting(true);
    setStatus(null);
    const result = await testTelegramConnection(token, chatId);
    setTesting(false);
    if (result.success) {
      setStatus({ type: 'success', msg: 'Koneksi Berhasil! Pesan tes telah dikirim ke Telegram Anda.' });
    } else {
      setStatus({ type: 'error', msg: `Gagal: ${result.error}` });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    saveTelegramConfig(token, chatId);
    setStatus({ type: 'success', msg: 'Pengaturan Telegram berhasil disimpan!' });
    if (onSaved) onSaved({ token, chatId });
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleResetToEnv = () => {
    localStorage.removeItem('TELEGRAM_BOT_TOKEN');
    localStorage.removeItem('TELEGRAM_CHAT_ID');
    const config = getTelegramConfig();
    setToken(config.token);
    setChatId(config.chatId);
    setStatus({ type: 'success', msg: 'Berhasil dikembalikan ke pengaturan bawaan .env!' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg leading-tight">Pengaturan Telegram Bot</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Konfigurasi Akun Telegram Anda</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          {/* Status Banner */}
          {status && (
            <div className={`p-3.5 rounded-xl flex items-start gap-3 text-xs leading-relaxed ${
              status.type === 'success' 
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}>
              {status.type === 'success' ? (
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              )}
              <div>{status.msg}</div>
            </div>
          )}

          {/* Bot Token Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-sky-500" />
                Telegram Bot Token
              </span>
              <a
                href="https://t.me/BotFather"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-sky-500 hover:underline flex items-center gap-1"
              >
                Dapatkan dari @BotFather <ExternalLink className="w-3 h-3" />
              </a>
            </label>
            <input
              type="password"
              placeholder="Contoh: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-mono placeholder:font-sans"
              required
            />
          </div>

          {/* Chat ID Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-sky-500" />
                Chat ID / Channel Username
              </span>
              <span className="text-[11px] text-slate-400 font-normal">Contoh: @channelku atau 1234567</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: @my_channel_news atau 987654321"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800 dark:text-slate-100 font-mono placeholder:font-sans"
              required
            />
          </div>

          {/* Hint info */}
          <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 rounded-xl text-[11px] text-sky-700 dark:text-sky-300 border border-sky-100 dark:border-sky-900/50 flex items-start gap-2">
            <HelpCircle className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <p>
              Pengaturan ini disimpan secara aman di browser lokal Anda (<b>localStorage</b>) untuk menghubungkan Bot Telegram milik Anda sendiri.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {testing ? 'Menguji...' : '🧪 Uji Koneksi'}
              </button>

              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/25 flex items-center justify-center gap-1.5"
              >
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
