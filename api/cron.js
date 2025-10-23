import { fetchFeeds } from "../lib/rss-fetcher.js";
import { summarizeNews } from "../lib/ai.js";
import { articleExists, saveArticle, cleanupOld } from "../lib/supabase.js";
import { sendMessage } from "../lib/telegram.js";

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default async function handler(req, res) {
  try {
    const feeds = process.env.RSS_FEEDS.split(",").map((f) => f.trim());
    const items = await fetchFeeds(feeds);

    let newCount = 0;
    for (const item of items) {
      if (await articleExists(item.guid)) continue;

      const text = `${item.title}\n\n${item.content}`;
      const summary = await summarizeNews(text);

      await saveArticle({
        source: item.source,
        title: item.title,
        guid: item.guid,
        summary,
      });

      await sendMessage(CHAT_ID, `*${item.title}*\n\n${summary}`);
      newCount++;
    }

    await cleanupOld();
    res.status(200).json({ ok: true, new: newCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
