function decodeHtmlEntities(str) {
  if (!str) return "";
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
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

    const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'Tanpa Judul';
    const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '#';
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
    const rawDesc = descMatch ? descMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '';

    const title = decodeHtmlEntities(rawTitle);
    const description = decodeHtmlEntities(stripHtml(rawDesc));
    const image = imgMatch ? imgMatch[1].trim() : '';

    return {
      id: link || `news-${index}`,
      title,
      link,
      pubDate,
      timestamp: pubDate ? new Date(pubDate).getTime() : Date.now() - index * 60000,
      image,
      caption: '',
      description,
      category: feedName
    };
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=300');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const targetUrl = req.query?.url || 'https://rss.tempo.co/nasional';
  const name = req.query?.name || 'Tempo.co';

  try {
    const fetchRes = await fetch(targetUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!fetchRes.ok) {
      return res.status(500).json({ error: `HTTP ${fetchRes.status} from Tempo RSS` });
    }

    const xmlText = await fetchRes.text();
    const newsList = parseXmlArticles(xmlText, name);

    return res.status(200).json({
      feedTitle: name,
      lastBuildDate: new Date().toISOString(),
      newsList
    });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
