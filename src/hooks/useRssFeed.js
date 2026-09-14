import { useState, useCallback } from 'react';

export function decodeHtmlEntities(str) {
  if (!str) return "";
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

export function formatDateIndo(dateStr) {
  if (!dateStr) return "Baru saja";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "Baru saja";
    if (diffMins < 60) return `${diffMins} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;

    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }) + " WIB";
  } catch (e) {
    return dateStr;
  }
}

export function extractItemImage(item, rawDesc = "", contentEncoded = "", rawItemXml = "") {
  // Strategy 1: Check direct <img>...</img> tag in raw XML snippet (specifically for Tempo.co)
  if (rawItemXml) {
    const directXmlMatch = rawItemXml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                           rawItemXml.match(/<img>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                           rawItemXml.match(/<img>\s*([\s\S]*?)\s*<\/img>/i);
    if (directXmlMatch && directXmlMatch[1] && directXmlMatch[1].trim().startsWith("http")) {
      return directXmlMatch[1].trim();
    }
  }

  // Strategy 2: Check direct <img> tag in DOM
  const imgNode = item?.querySelector?.("img") || item?.getElementsByTagName?.("img")?.[0];
  if (imgNode) {
    const url = imgNode.textContent?.trim() || imgNode.getAttribute("src") || imgNode.getAttribute("url");
    if (url && url.startsWith("http")) return url;
  }

  // Strategy 3: Check Yahoo Media Content / Thumbnail (<media:content url="..."> or <media:thumbnail url="...">)
  const mediaContent = item?.getElementsByTagName?.("media:content")?.[0] || 
                       item?.getElementsByTagName?.("media:thumbnail")?.[0] ||
                       item?.querySelector?.("media\\:content, content") ||
                       item?.querySelector?.("media\\:thumbnail, thumbnail");
  if (mediaContent) {
    const url = mediaContent.getAttribute("url") || mediaContent.getAttribute("href") || mediaContent.textContent?.trim();
    if (url && url.startsWith("http")) return url;
  }

  // Strategy 4: Check Enclosure (<enclosure url="...">)
  const enclosure = item?.querySelector?.("enclosure");
  if (enclosure) {
    const url = enclosure.getAttribute("url") || enclosure.getAttribute("href");
    if (url && url.startsWith("http")) return url;
  }

  // Strategy 5: Check <image> or <url> tag inside <item>
  const imageTag = item?.querySelector?.("image, featured_image, thumbnail, thumb");
  if (imageTag) {
    const url = imageTag.querySelector?.("url")?.textContent?.trim() || imageTag.textContent?.trim();
    if (url && url.startsWith("http")) return url;
  }

  // Strategy 6: Extract <img> tag from CDATA in content:encoded or description HTML or raw XML snippet
  const fullHtml = (contentEncoded + " " + rawDesc + " " + rawItemXml);
  if (fullHtml) {
    const imgMatch = fullHtml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                     fullHtml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                     fullHtml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i) ||
                     fullHtml.match(/<img[^>]+src=\s*["']?([^"'\s>]+)/i);
    if (imgMatch && imgMatch[1] && imgMatch[1].startsWith("http")) {
      return imgMatch[1];
    }
  }

  return "";
}

export function parseRssXml(xmlString, fallbackFeedName = "KilasFeed") {
  const parser = new DOMParser();
  let xmlDoc = parser.parseFromString(xmlString, "application/xml");

  let items = xmlDoc.querySelectorAll("item");
  let isAtom = false;

  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError || items.length === 0) {
    const htmlParser = new DOMParser();
    const htmlDoc = htmlParser.parseFromString(xmlString, "text/html");
    const htmlItems = htmlDoc.querySelectorAll("item, entry");
    if (htmlItems.length > 0) {
      xmlDoc = htmlDoc;
      items = htmlItems;
    }
  }

  const channel = xmlDoc.querySelector("channel");
  const rawFeedTitle = channel?.querySelector("title")?.textContent || fallbackFeedName;
  const feedTitle = decodeHtmlEntities(rawFeedTitle);
  const lastBuildDate = channel?.querySelector("lastBuildDate")?.textContent || 
                        channel?.querySelector("pubDate")?.textContent || "";

  if (items.length === 0) {
    items = xmlDoc.querySelectorAll("entry");
    isAtom = true;
  }

  // Pre-extract raw item XML blocks from xmlString for 100% reliable regex image extraction
  const rawItemXmlList = xmlString.match(/<(item|entry)[\s\S]*?<\/(item|entry)>/gi) || [];

  const newsList = [];

  items.forEach((item, index) => {
    const rawTitle = item.querySelector("title")?.textContent?.trim() || "Tanpa Judul";
    const title = decodeHtmlEntities(rawTitle);
    
    let link = "#";
    if (isAtom) {
      link = item.querySelector("link")?.getAttribute("href") || "#";
    } else {
      link = item.querySelector("link")?.textContent?.trim() || 
             item.querySelector("guid")?.textContent?.trim() || "#";
    }

    const pubDateStr = item.querySelector("pubDate")?.textContent?.trim() || 
                       item.querySelector("updated")?.textContent?.trim() || 
                       item.querySelector("published")?.textContent?.trim() || "";

    const guid = item.querySelector("guid")?.textContent?.trim() || 
                 item.querySelector("id")?.textContent?.trim() || `news-${index}-${Date.now()}`;

    let rawDesc = item.querySelector("description")?.textContent || 
                   item.querySelector("summary")?.textContent || "";
    let contentEncoded = item.getElementsByTagName("content:encoded")[0]?.textContent || "";

    // Image Extraction with raw item XML block matching
    const rawItemXml = rawItemXmlList[index] || "";
    let imageUrl = extractItemImage(item, rawDesc, contentEncoded, rawItemXml);
    let imageCaption = "";

    const mediaDesc = item.getElementsByTagName("media:description")[0];
    if (mediaDesc) imageCaption = decodeHtmlEntities(mediaDesc.textContent?.trim() || "");

    let cleanText = contentEncoded || rawDesc;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = cleanText;
    let cleanSnippet = tempDiv.textContent || tempDiv.innerText || "";
    cleanSnippet = decodeHtmlEntities(cleanSnippet.replace(/\s+/g, " ").trim());

    let rawCategory = item.querySelector("category")?.textContent || feedTitle.split("–")[0].trim();
    let category = decodeHtmlEntities(rawCategory);

    newsList.push({
      id: guid,
      title,
      link,
      pubDate: pubDateStr,
      timestamp: pubDateStr ? new Date(pubDateStr).getTime() : Date.now() - index * 60000,
      image: imageUrl,
      caption: imageCaption,
      description: cleanSnippet,
      category
    });
  });

  return { feedTitle, lastBuildDate, newsList };
}

export function parseFeed2Json(jsonObj, fallbackFeedName = "KilasFeed") {
  if (!jsonObj || !jsonObj.items) return null;
  const rawFeedTitle = jsonObj.title || fallbackFeedName;
  const feedTitle = decodeHtmlEntities(rawFeedTitle);
  const lastBuildDate = "";

  const newsList = jsonObj.items.map((item, index) => {
    let imageUrl = item.image || item.banner_image || item.thumbnail || item.enclosure?.url || item.enclosure?.link || "";
    if (!imageUrl && (item.content_html || item.summary || JSON.stringify(item))) {
      const fullHtml = (item.content_html + " " + item.summary + " " + JSON.stringify(item));
      const imgMatch = fullHtml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                       fullHtml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i) ||
                       fullHtml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                       fullHtml.match(/<img>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i);
      if (imgMatch && imgMatch[1] && imgMatch[1].startsWith("http")) imageUrl = imgMatch[1];
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = item.content_html || item.summary || "";
    let cleanSnippet = tempDiv.textContent || tempDiv.innerText || "";
    cleanSnippet = decodeHtmlEntities(cleanSnippet.replace(/\s+/g, " ").trim());

    const rawTitle = item.title?.trim() || "Tanpa Judul";
    const title = decodeHtmlEntities(rawTitle);
    const category = feedTitle.split("–")[0].trim();

    return {
      id: item.id || item.url || `news-f2j-${index}-${Date.now()}`,
      title,
      link: item.url || "#",
      pubDate: item.date_published || "",
      timestamp: item.date_published ? new Date(item.date_published).getTime() : Date.now() - index * 60000,
      image: imageUrl,
      caption: "",
      description: cleanSnippet,
      category
    };
  });

  return { feedTitle, lastBuildDate, newsList };
}

export function parseRssJson(jsonObj, fallbackFeedName = "KilasFeed") {
  if (!jsonObj || !jsonObj.items) return null;
  const rawFeedTitle = jsonObj.feed?.title || fallbackFeedName;
  const feedTitle = decodeHtmlEntities(rawFeedTitle);
  const lastBuildDate = jsonObj.feed?.pubDate || "";

  const newsList = jsonObj.items.map((item, index) => {
    let imageUrl = item.thumbnail || item.image || item.banner_image || item.enclosure?.link || item.enclosure?.url || "";
    if (!imageUrl && (item.content || item.description || JSON.stringify(item))) {
      const fullHtml = (item.content + " " + item.description + " " + JSON.stringify(item));
      const imgMatch = fullHtml.match(/<img[^>]+src=["']([^"']+)["']/i) ||
                       fullHtml.match(/&lt;img[^&]+src=&quot;([^&]+)&quot;/i) ||
                       fullHtml.match(/<img[^>]*>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i) ||
                       fullHtml.match(/<img>\s*(https?:\/\/[^<"'\s]+)\s*<\/img>/i);
      if (imgMatch && imgMatch[1] && imgMatch[1].startsWith("http")) imageUrl = imgMatch[1];
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = item.content || item.description || "";
    let cleanSnippet = tempDiv.textContent || tempDiv.innerText || "";
    cleanSnippet = decodeHtmlEntities(cleanSnippet.replace(/\s+/g, " ").trim());

    const rawTitle = item.title?.trim() || "Tanpa Judul";
    const title = decodeHtmlEntities(rawTitle);

    const rawCategory = item.categories?.[0] || feedTitle.split("–")[0].trim();
    const category = decodeHtmlEntities(rawCategory);

    const rawCaption = item.categories?.join(", ") || "";
    const caption = decodeHtmlEntities(rawCaption);

    return {
      id: item.guid || item.link || `news-json-${index}-${Date.now()}`,
      title,
      link: item.link || "#",
      pubDate: item.pubDate || "",
      timestamp: item.pubDate ? new Date(item.pubDate).getTime() : Date.now() - index * 60000,
      image: imageUrl,
      caption,
      description: cleanSnippet,
      category
    };
  });

  return { feedTitle, lastBuildDate, newsList };
}

const FEED_CACHE = new Map();

async function fetchFeedData(feedObj, forceRefresh = false) {
  if (!feedObj) return { newsList: [], feedTitle: "KilasFeed", lastBuildDate: "", proxyMode: "Error" };
  const { url, name } = feedObj;

  const cleanUrl = (url || "").trim();
  const httpsUrl = cleanUrl.replace(/^http:\/\//i, "https://");
  const urlsToTry = Array.from(new Set([httpsUrl, cleanUrl])).filter(Boolean);
  const isTempoFeed = cleanUrl.includes("tempo.co");

  // 1. SWR Cache check
  const cached = FEED_CACHE.get(httpsUrl) || FEED_CACHE.get(cleanUrl);
  if (cached && !forceRefresh) {
    return { ...cached, proxyMode: cached.proxyMode + " (Instan)" };
  }

  // Helper for safe fetch with timeout
  const fetchTextWithTimeout = async (targetUrl, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(targetUrl, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timer);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      clearTimeout(timer);
      return null;
    }
  };

  // Tempo Strategy
  if (isTempoFeed) {
    for (const targetUrl of urlsToTry) {
      try {
        const apiTempoUrl = `/api/tempo?url=${encodeURIComponent(targetUrl)}&name=${encodeURIComponent(name)}`;
        const text = await fetchTextWithTimeout(apiTempoUrl, 5000);
        if (text) {
          const json = JSON.parse(text);
          if (json && json.newsList && json.newsList.length > 0) {
            const result = { ...json, proxyMode: "Tempo Live" };
            FEED_CACHE.set(httpsUrl, result);
            FEED_CACHE.set(cleanUrl, result);
            return result;
          }
        }
      } catch (e) {}
    }
  }

  // Strategy 1: Direct XML
  for (const targetUrl of urlsToTry) {
    const text = await fetchTextWithTimeout(targetUrl, 4500);
    if (text && (text.includes("<rss") || text.includes("<feed") || text.includes("<xml"))) {
      const parsed = parseRssXml(text, name);
      if (parsed.newsList && parsed.newsList.length > 0) {
        const result = { ...parsed, proxyMode: "Direct Live" };
        FEED_CACHE.set(httpsUrl, result);
        FEED_CACHE.set(cleanUrl, result);
        return result;
      }
    }
  }

  // Strategy 2: Serverless Proxy /api/rss
  for (const targetUrl of urlsToTry) {
    try {
      const apiRssUrl = `/api/rss?url=${encodeURIComponent(targetUrl)}&name=${encodeURIComponent(name)}`;
      const text = await fetchTextWithTimeout(apiRssUrl, 5000);
      if (text) {
        const json = JSON.parse(text);
        if (json && json.newsList && json.newsList.length > 0) {
          const result = { ...json, proxyMode: "Serverless Proxy" };
          FEED_CACHE.set(httpsUrl, result);
          FEED_CACHE.set(cleanUrl, result);
          return result;
        }
      }
    } catch (e) {}
  }

  // Strategy 3: Feed2JSON
  for (const targetUrl of urlsToTry) {
    try {
      const proxyUrl = `https://feed2json.org/convert?url=${encodeURIComponent(targetUrl)}`;
      const text = await fetchTextWithTimeout(proxyUrl, 4500);
      if (text) {
        const json = JSON.parse(text);
        if (json && json.items && json.items.length > 0) {
          const parsed = parseFeed2Json(json, name);
          if (parsed.newsList && parsed.newsList.length > 0) {
            const result = { ...parsed, proxyMode: "Feed2JSON Live" };
            FEED_CACHE.set(httpsUrl, result);
            FEED_CACHE.set(cleanUrl, result);
            return result;
          }
        }
      }
    } catch (e) {}
  }

  // Strategy 4: RSS2JSON API
  for (const targetUrl of urlsToTry) {
    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(targetUrl)}`;
      const text = await fetchTextWithTimeout(proxyUrl, 4500);
      if (text) {
        const json = JSON.parse(text);
        if (json && json.status === "ok" && json.items && json.items.length > 0) {
          const parsed = parseRssJson(json, name);
          if (parsed.newsList && parsed.newsList.length > 0) {
            const result = { ...parsed, proxyMode: "RSS2JSON Live" };
            FEED_CACHE.set(httpsUrl, result);
            FEED_CACHE.set(cleanUrl, result);
            return result;
          }
        }
      }
    } catch (e) {}
  }

  // Strategy 5: AllOrigins GET Proxy
  for (const targetUrl of urlsToTry) {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;
      const text = await fetchTextWithTimeout(proxyUrl, 4500);
      if (text) {
        let xmlContent = "";
        try {
          const json = JSON.parse(text);
          xmlContent = json.contents || "";
        } catch (e) {
          xmlContent = text;
        }
        if (xmlContent && (xmlContent.includes("<rss") || xmlContent.includes("<feed") || xmlContent.includes("<xml"))) {
          const parsed = parseRssXml(xmlContent, name);
          if (parsed.newsList && parsed.newsList.length > 0) {
            const result = { ...parsed, proxyMode: "AllOrigins Live" };
            FEED_CACHE.set(httpsUrl, result);
            FEED_CACHE.set(cleanUrl, result);
            return result;
          }
        }
      }
    } catch (e) {}
  }

  // Strategy 6: Codetabs Proxy
  for (const targetUrl of urlsToTry) {
    try {
      const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;
      const text = await fetchTextWithTimeout(proxyUrl, 4500);
      if (text && (text.includes("<rss") || text.includes("<feed") || text.includes("<xml"))) {
        const parsed = parseRssXml(text, name);
        if (parsed.newsList && parsed.newsList.length > 0) {
          const result = { ...parsed, proxyMode: "Codetabs Live" };
          FEED_CACHE.set(httpsUrl, result);
          FEED_CACHE.set(cleanUrl, result);
          return result;
        }
      }
    } catch (e) {}
  }

  return { newsList: [], feedTitle: name, lastBuildDate: "-", proxyMode: "Akses Dibatasi" };
}

export function useRssFeed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [proxyMode, setProxyMode] = useState("Direct Live");
  const [lastUpdated, setLastUpdated] = useState("");
  const [feedTitle, setFeedTitle] = useState("");

  const fetchFeed = useCallback(async (feedObj, forceRefresh = false) => {
    if (!feedObj) return;
    setLoading(true);
    const data = await fetchFeedData(feedObj, forceRefresh);
    setItems(data.newsList);
    setFeedTitle(data.feedTitle || feedObj.name);
    setLastUpdated(data.lastBuildDate ? formatDateIndo(data.lastBuildDate) : "Baru saja");
    setProxyMode(data.proxyMode);
    setLoading(false);
    return { success: data.newsList.length > 0, count: data.newsList.length };
  }, []);

  const fetchAllFeeds = useCallback(async (feedsListArg, forceRefresh = false) => {
    if (!feedsListArg || feedsListArg.length === 0) return;

    setLoading(true);
    setFeedTitle("Berita Utama Terkini (Seluruh Media)");
    setProxyMode("Multi-Media Stream");

    const results = await Promise.allSettled(
      feedsListArg.map(feedObj => fetchFeedData(feedObj, forceRefresh))
    );

    let combinedList = [];
    const seenKeys = new Set();

    results.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value && res.value.newsList) {
        const feedName = feedsListArg[idx]?.name || 'Berita';
        res.value.newsList.forEach(item => {
          const titleKey = (item.title || '').toLowerCase().replace(/[^\w]/g, '');
          if (titleKey && !seenKeys.has(titleKey)) {
            seenKeys.add(titleKey);
            combinedList.push({
              ...item,
              category: item.category || feedName
            });
          }
        });
      }
    });

    // Sort chronologically (newest timestamp first)
    combinedList.sort((a, b) => b.timestamp - a.timestamp);

    setItems(combinedList);
    setLastUpdated("Baru saja");
    setLoading(false);

    return { success: combinedList.length > 0, count: combinedList.length };
  }, []);

  return { items, loading, proxyMode, lastUpdated, feedTitle, fetchFeed, fetchAllFeeds, setItems };
}
