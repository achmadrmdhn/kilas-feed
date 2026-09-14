import { RSS_FEEDS } from '../src/data/feeds.js';

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

  return `📰 <b>[${escapeHtml(categoryStr)}]</b>\n\n` +
    `<b>${escapeHtml(titleStr)}</b>\n\n` +
    (descStr ? `<i>${escapeHtml(descStr)}</i>\n\n` : '') +
    `📅 <b>Waktu:</b> ${escapeHtml(dateFormatted)}\n` +
    `🔗 <a href="${escapeHtml(articleUrl)}">Baca Selengkapnya</a>`;
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

async function sendTelegramMessage(token, chatId, item, feedName) {
  const caption = formatCaption(item, feedName);
  const articleUrl = item.url || item.link || '';
  const inlineKeyboard = {
    inline_keyboard: [[{ text: '🔗 Baca Artikel Asli', url: articleUrl || 'https://telegram.org' }]]
  };
  const cleanImageUrl = item.image && item.image.startsWith('http') ? item.image : '';

  if (cleanImageUrl) {
    try {
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
      if (photoData.ok) return photoData.result;
    } catch (e) {}
  }

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
  return await msgRes.json();
}

export default async function handler(req, res) {
  const token = process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID || process.env.VITE_TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return res.status(400).json({ error: 'TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID environment variables must be configured on Vercel.' });
  }

  let totalSent = 0;
  // Sample 5 random feeds per cron trigger to keep execution fast within Vercel's 10s serverless limit
  const shuffledFeeds = [...RSS_FEEDS].sort(() => 0.5 - Math.random()).slice(0, 5);

  for (const feed of shuffledFeeds) {
    try {
      const articles = await fetchFeedArticles(feed);
      // Exclude articles older than 24 hours
      const freshArticles = articles.filter(art => {
        const pubDateStr = art.date_published || art.pubDate || '';
        return !isOlderThan24Hours(pubDateStr);
      });

      if (freshArticles.length > 0) {
        const topArticle = freshArticles[0];
        await sendTelegramMessage(token, chatId, topArticle, feed.name);
        totalSent++;
      }
    } catch (e) {}
  }

  return res.status(200).json({
    success: true,
    message: `Vercel Cron Trigger Success. Sent ${totalSent} fresh articles to Telegram.`,
    timestamp: new Date().toISOString()
  });
}
