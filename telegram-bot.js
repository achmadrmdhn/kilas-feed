import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RSS_FEEDS } from './src/data/feeds.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env manually if present
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = val;
    }
  });
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const INTERVAL_MINUTES = parseInt(process.env.CHECK_INTERVAL_MINUTES || '10', 10);
const HISTORY_FILE = path.join(__dirname, 'sent_articles.json');

// Load sent history
function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8');
      return new Set(JSON.parse(data));
    }
  } catch (e) {
    console.error('Error reading sent_articles.json:', e.message);
  }
  return new Set();
}

// Save sent history
function saveHistory(historySet) {
  try {
    // Keep max last 2000 items to avoid bloating
    const arr = Array.from(historySet).slice(-2000);
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(arr, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing sent_articles.json:', e.message);
  }
}

function normalizeTitle(title) {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '')
    .trim();
}

function normalizeUrl(urlStr) {
  if (!urlStr || urlStr === '#') return '';
  try {
    const u = new URL(urlStr);
    return (u.hostname + u.pathname).toLowerCase().replace(/\/$/, '');
  } catch (e) {
    return urlStr.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
  }
}

function parsePubTimestamp(dateStr) {
  if (!dateStr) return Date.now();
  try {
    const d = new Date(dateStr);
    const ts = d.getTime();
    return isNaN(ts) ? Date.now() : ts;
  } catch (e) {
    return Date.now();
  }
}

function isOlderThan24Hours(pubDateStr) {
  if (!pubDateStr) return false;
  const ts = parsePubTimestamp(pubDateStr);
  const now = Date.now();
  const diffHours = (now - ts) / (1000 * 60 * 60);
  if (diffHours < -1) return false;
  return diffHours > 24;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

function formatTelegramDate(dateStr) {
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

function formatCaption(item, feedName) {
  const categoryStr = (feedName || item.category || 'BERITA TERKINI').toUpperCase();
  const titleStr = item.title || 'Tanpa Judul';
  
  let descStr = stripHtml(item.description || item.summary || item.content_html || '');
  if (descStr.length > 250) {
    descStr = descStr.substring(0, 247) + '...';
  }

  const rawDate = item.date_published || item.pubDate || '';
  const dateFormatted = formatTelegramDate(rawDate);
  const articleUrl = item.url || item.link || '#';

  const captionHtml = `📰 <b>[${escapeHtml(categoryStr)}]</b>\n\n` +
    `<b>${escapeHtml(titleStr)}</b>\n\n` +
    (descStr ? `<i>${escapeHtml(descStr)}</i>\n\n` : '') +
    `📅 <b>Waktu:</b> ${escapeHtml(dateFormatted)}\n` +
    `🔗 <a href="${escapeHtml(articleUrl)}">Baca Selengkapnya</a>`;

  return captionHtml;
}

function parseXmlArticles(xmlText, feedName) {
  const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || xmlText.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
  return items.map((itemXml, index) => {
    const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i) || itemXml.match(/<guid>([\s\S]*?)<\/guid>/i);
    const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<updated>([\s\S]*?)<\/updated>/i);
    const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i) || itemXml.match(/<summary>([\s\S]*?)<\/summary>/i);

    // Extract Image (Tempo <img> tag + Media content + Enclosure + <img> src in HTML)
    const imgMatch = itemXml.match(/<img>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                     itemXml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                     itemXml.match(/url=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp|gif)[^"'\s]*)["']/i) ||
                     itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                     itemXml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i);

    const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'Tanpa Judul';
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '#';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';
    const image = imgMatch ? imgMatch[1].trim() : '';

    return {
      id: link || `news-${index}`,
      title,
      url: link,
      link: link,
      date_published: pubDate,
      pubDate: pubDate,
      description: description,
      image: image,
      category: feedName
    };
  });
}

// Fetch single RSS feed via Direct XML or Feed2JSON / RSS2JSON proxy
async function fetchFeedArticles(feedObj) {
  const targetUrl = feedObj.url;

  // 1. Direct XML Fetch (Preserves Tempo <img> tags and native XML structures)
  try {
    const res = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (res.ok) {
      const xmlText = await res.text();
      if (xmlText.includes('<item') || xmlText.includes('<entry')) {
        const parsed = parseXmlArticles(xmlText, feedObj.name);
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (e) {}

  // 2. AllOrigins Raw Proxy (Backup raw XML with <img> tags)
  try {
    const rawProxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(rawProxyUrl);
    if (res.ok) {
      const xmlText = await res.text();
      if (xmlText.includes('<item') || xmlText.includes('<entry')) {
        const parsed = parseXmlArticles(xmlText, feedObj.name);
        if (parsed.length > 0) return parsed;
      }
    }
  } catch (e) {}

  // 3. Feed2JSON Proxy
  try {
    const feed2jsonUrl = `https://feed2json.org/convert?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(feed2jsonUrl);
    if (res.ok) {
      const json = await res.json();
      if (json && json.items && json.items.length > 0) {
        return json.items.map(item => {
          let imageUrl = item.image || item.banner_image || item.thumbnail || item.enclosure?.url || '';
          if (!imageUrl && (item.content_html || item.summary || JSON.stringify(item))) {
            const fullHtml = (item.content_html || '') + ' ' + (item.summary || '') + ' ' + JSON.stringify(item);
            const imgMatch = fullHtml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                             fullHtml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i);
            if (imgMatch && imgMatch[1] && imgMatch[1].startsWith('http')) imageUrl = imgMatch[1];
          }
          return {
            id: item.id || item.url || item.title,
            title: item.title,
            url: item.url,
            link: item.url,
            description: item.summary || item.content_html,
            image: imageUrl,
            date_published: item.date_published,
            category: feedObj.name
          };
        });
      }
    }
  } catch (e) {}

  return [];
}

async function sendTelegramMessage(item, feedName) {
  if (!BOT_TOKEN || !CHAT_ID) {
    throw new Error('BOT_TOKEN & CHAT_ID wajib diisi di file .env');
  }

  const caption = formatCaption(item, feedName);
  const articleUrl = item.url || item.link || '';

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '🔗 Baca Artikel Asli', url: articleUrl || 'https://telegram.org' }
      ]
    ]
  };

  const cleanImageUrl = item.image && item.image.startsWith('http') ? item.image : '';

  if (cleanImageUrl) {
    try {
      const photoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
      const photoRes = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          photo: cleanImageUrl,
          caption: caption,
          parse_mode: 'HTML',
          reply_markup: inlineKeyboard
        })
      });
      const photoData = await photoRes.json();
      if (photoData.ok) return photoData.result;
    } catch (e) {
      // Fallback to text
    }
  }

  // Send Text Message
  const msgUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const msgRes = await fetch(msgUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: caption,
      parse_mode: 'HTML',
      disable_web_page_preview: false,
      reply_markup: inlineKeyboard
    })
  });

  const msgData = await msgRes.json();
  if (!msgData.ok) {
    throw new Error(msgData.description || 'Gagal mengirim pesan');
  }
  return msgData.result;
}

// Main Polling Loop
async function runCheck() {
  console.log(`\n========================================`);
  console.log(`[${new Date().toLocaleTimeString('id-ID')}] 🔍 Mengecek seluruh ${RSS_FEEDS.length} kanal RSS...`);

  if (!BOT_TOKEN || !CHAT_ID) {
    console.error('❌ PERINGATAN: TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID belum diatur di file .env!');
    console.error('Silakan buat file .env dengan format:\nTELEGRAM_BOT_TOKEN=... \nTELEGRAM_CHAT_ID=...\n');
    return;
  }

  const history = loadHistory();
  let newCount = 0;

  for (const feed of RSS_FEEDS) {
    try {
      const articles = await fetchFeedArticles(feed);
      if (articles.length === 0) continue;

      // Strict Deduplication & 24-Hour Age Filter
      const unreadArticles = articles.filter(art => {
        const pubDateStr = art.date_published || art.pubDate || '';
        if (isOlderThan24Hours(pubDateStr)) {
          return false; // Exclude news older than 24 hours
        }

        const titleKey = normalizeTitle(art.title);
        const urlKey = normalizeUrl(art.url || art.link);
        const idKey = art.id;

        if ((titleKey && history.has(titleKey)) || 
            (urlKey && history.has(urlKey)) || 
            (idKey && history.has(idKey))) {
          return false; // Exclude duplicate news
        }

        return true;
      }).slice(0, 2);

      for (const item of unreadArticles) {
        try {
          console.log(`🚀 [Kirim ke Telegram] (${feed.name}): ${item.title}`);
          await sendTelegramMessage(item, feed.name);
          
          const titleKey = normalizeTitle(item.title);
          const urlKey = normalizeUrl(item.url || item.link);
          if (titleKey) history.add(titleKey);
          if (urlKey) history.add(urlKey);
          if (item.id) history.add(item.id);

          newCount++;
          // Pause 1.5 second between telegram messages to comply with Telegram rate limits
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          console.error(`  ⚠️ Gagal mengirim artikel "${item.title}":`, err.message);
        }
      }
    } catch (e) {
      console.error(`  ❌ Error mengecek feed ${feed.name}:`, e.message);
    }
  }

  saveHistory(history);
  console.log(`✅ Pemeriksaan selesai! ${newCount} berita baru dikirim ke Bot Telegram.`);
}

// CLI Execution Mode
const isOnceMode = process.argv.includes('--once');

if (isOnceMode) {
  runCheck().then(() => process.exit(0));
} else {
  console.log(`⚡ KilasFeed Telegram Bot Auto-Poster Aktif!`);
  console.log(`📅 Pengecekan dilakukan setiap ${INTERVAL_MINUTES} menit.`);
  console.log(`💡 Tekan Ctrl + C untuk memberhentikan bot.\n`);

  runCheck();
  setInterval(runCheck, INTERVAL_MINUTES * 60 * 1000);
}
