import Parser from "rss-parser";
const parser = new Parser();

export async function fetchFeeds(feedUrls) {
  const results = [];
  for (const url of feedUrls) {
    try {
      const feed = await parser.parseURL(url);
      for (const item of feed.items) {
        results.push({
          source: feed.title,
          title: item.title,
          content:
            item.contentSnippet || item.content || item.summary || "No content",
          guid: item.guid || item.link || item.title,
          pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
        });
      }
    } catch (err) {
      console.error("Error fetching RSS:", url, err.message);
    }
  }
  results.sort((a, b) => b.pubDate - a.pubDate);
  return results;
}
