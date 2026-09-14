import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function rssProxyPlugin() {
  return {
    name: 'rss-proxy-plugin',
    configureServer(server) {
      const handleRssRequest = async (req, res) => {
        const urlObj = new URL(req.url, 'http://localhost');
        const targetUrl = urlObj.searchParams.get('url') || 'https://rss.tempo.co/nasional';
        const name = urlObj.searchParams.get('name') || 'KilasFeed';

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');

        try {
          const fetchRes = await fetch(targetUrl, { 
            headers: { 
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
            } 
          });

          if (!fetchRes.ok) {
            res.statusCode = 500;
            return res.end(JSON.stringify({ error: `HTTP ${fetchRes.status}` }));
          }

          const xmlText = await fetchRes.text();
          const items = xmlText.match(/<item>[\s\S]*?<\/item>/gi) || xmlText.match(/<entry>[\s\S]*?<\/entry>/gi) || [];
          const newsList = items.map((itemXml, index) => {
            const titleMatch = itemXml.match(/<title>([\s\S]*?)<\/title>/i);
            const linkMatch = itemXml.match(/<link>([\s\S]*?)<\/link>/i) || itemXml.match(/<guid>([\s\S]*?)<\/guid>/i);
            const pubDateMatch = itemXml.match(/<pubDate>([\s\S]*?)<\/pubDate>/i) || itemXml.match(/<updated>([\s\S]*?)<\/updated>/i);
            const descMatch = itemXml.match(/<description>([\s\S]*?)<\/description>/i) || itemXml.match(/<summary>([\s\S]*?)<\/summary>/i);
            const contentMatch = itemXml.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);

            const imgMatch = itemXml.match(/<img>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                             itemXml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                             itemXml.match(/url=["'](https?:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp|gif)[^"'\s]*)["']/i) ||
                             itemXml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                             itemXml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i);

            const rawTitle = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : 'Tanpa Judul';
            const link = linkMatch ? linkMatch[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').trim() : '#';
            const pubDate = pubDateMatch ? pubDateMatch[1].trim() : '';
            const rawDesc = (contentMatch ? contentMatch[1] : (descMatch ? descMatch[1] : ''))
              .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
              .replace(/<[^>]*>?/gm, '')
              .replace(/\s+/g, ' ')
              .trim();
            const rawImgUrl = imgMatch ? imgMatch[1].trim() : '';
            let image = rawImgUrl.replace(/&amp;/g, '&');
            if (image.startsWith('http:')) image = image.replace('http:', 'https:');

            return {
              id: link || `news-${index}`,
              title: rawTitle.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
              link,
              pubDate,
              timestamp: pubDate ? new Date(pubDate).getTime() : Date.now() - index * 60000,
              image,
              caption: '',
              description: rawDesc.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
              category: name
            };
          });

          res.statusCode = 200;
          return res.end(JSON.stringify({ feedTitle: name, lastBuildDate: new Date().toISOString(), newsList }));
        } catch (e) {
          res.statusCode = 500;
          return res.end(JSON.stringify({ error: e.message }));
        }
      };

      server.middlewares.use('/api/tempo', handleRssRequest);
      server.middlewares.use('/api/rss', handleRssRequest);
    }
  };
}

export default defineConfig({
  plugins: [react(), rssProxyPlugin()],
  server: {
    port: 3000,
    open: false,
  },
});
