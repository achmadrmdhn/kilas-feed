// Utility Service for Telegram Bot Integration

export function getTelegramConfig() {
  const envToken = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_BOT_TOKEN) || '';
  const envChatId = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_TELEGRAM_CHAT_ID) || '';

  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('TELEGRAM_BOT_TOKEN');
    const localChatId = localStorage.getItem('TELEGRAM_CHAT_ID');

    const token = (localToken && localToken.trim() !== '') ? localToken : envToken;
    const chatId = (localChatId && localChatId.trim() !== '') ? localChatId : envChatId;

    return { token, chatId };
  }

  return { token: envToken, chatId: envChatId };
}

export function saveTelegramConfig(token, chatId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('TELEGRAM_BOT_TOKEN', token.trim());
    localStorage.setItem('TELEGRAM_CHAT_ID', chatId.trim());
  }
}

export function formatTelegramDate(dateStr) {
  if (!dateStr) return 'Baru saja';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    const dayFormatter = new Intl.DateTimeFormat('id-ID', { weekday: 'long', timeZone: 'Asia/Jakarta' });
    const timeFormatter = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' });
    const dateFormatter = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' });

    const dayName = dayFormatter.format(d);
    const timeStr = timeFormatter.format(d).replace('.', ':');
    const dateText = dateFormatter.format(d);

    return `${timeStr} WIB, ${dayName}, ${dateText}`;
  } catch (e) {
    return dateStr;
  }
}

export function formatTelegramCaption(item) {
  const categoryStr = (item.category || 'BERITA TERKINI').toUpperCase();
  const titleStr = item.title || 'Tanpa Judul';
  
  let descStr = item.description || '';
  if (descStr.length > 250) {
    descStr = descStr.substring(0, 247) + '...';
  }

  const rawDate = item.pubDate || item.date_published || '';
  const dateFormatted = formatTelegramDate(rawDate);
  const articleUrl = item.link || item.url || '#';

  const captionHtml = `📰 <b>[${escapeHtml(categoryStr)}]</b>\n\n` +
    `<b>${escapeHtml(titleStr)}</b>\n\n` +
    (descStr ? `<i>${escapeHtml(descStr)}</i>\n\n` : '') +
    `📅 <b>Waktu:</b> ${escapeHtml(dateFormatted)}\n` +
    `🔗 <a href="${escapeHtml(articleUrl)}">Baca Selengkapnya di Artikel Asli</a>`;

  return captionHtml;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendNewsToTelegram(item, customConfig = null) {
  const config = customConfig || getTelegramConfig();
  const { token, chatId } = config;

  if (!token || !chatId) {
    return {
      success: false,
      error: 'Pengaturan Telegram Bot Token atau Chat ID belum diisi. Pastikan VITE_TELEGRAM_BOT_TOKEN dan VITE_TELEGRAM_CHAT_ID diset di .env atau Vercel.'
    };
  }

  const caption = formatTelegramCaption(item);
  const articleUrl = item.link && item.link !== '#' ? item.link : '';

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🔗 Baca Artikel Asli', url: articleUrl || 'https://telegram.org' }
      ]
    ]
  };

  const cleanImageUrl = item.image && item.image.startsWith('http') ? item.image : '';

  try {
    if (cleanImageUrl) {
      // Try sending with Photo
      const photoUrl = `https://api.telegram.org/bot${token}/sendPhoto`;
      const photoRes = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          photo: cleanImageUrl,
          caption: caption,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard
        })
      });

      const photoData = await photoRes.json();
      if (photoData.ok) {
        return { success: true, data: photoData.result };
      }
      
      // If image send fails (e.g. invalid image link/CORS), fallback to text message
    }

    // Send Text Message
    const msgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const msgRes = await fetch(msgUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
        disable_web_page_preview: false,
        reply_markup: inlineKeyboard
      })
    });

    const msgData = await msgRes.json();
    if (msgData.ok) {
      return { success: true, data: msgData.result };
    } else {
      return {
        success: false,
        error: msgData.description || 'Gagal mengirim pesan ke Telegram.'
      };
    }
  } catch (err) {
    return {
      success: false,
      error: err.message || 'Terjadi kesalahan koneksi ke Telegram API.'
    };
  }
}

export async function testTelegramConnection(token, chatId) {
  if (!token || !chatId) {
    return { success: false, error: 'Token dan Chat ID wajib diisi.' };
  }

  try {
    const testUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const res = await fetch(testUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '⚡ <b>KilasFeed Telegram Bot Test</b>\n\nKoneksi ke Bot Telegram berhasil! Anda siap menerima kabar berita terbaru.',
        parse_mode: 'HTML'
      })
    });

    const data = await res.json();
    if (data.ok) {
      return { success: true };
    } else {
      return { success: false, error: data.description || 'Token atau Chat ID tidak valid.' };
    }
  } catch (err) {
    return { success: false, error: err.message || 'Gagal terhubung ke Telegram API.' };
  }
}
