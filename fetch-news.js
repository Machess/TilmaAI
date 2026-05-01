// scripts/fetch-news.js
// Fetches AI news from Hacker News API and RSS feeds.
// Filters for AI relevance, picks the 3 best, writes to data/news.json.
// No API keys. No cost. Runs daily via GitHub Actions at 06:00 UTC.

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const NEWS_JSON_PATH = path.resolve('data/news.json');
const MAX_NEWS_POSTS = 20;

const RSS_FEEDS = [
  { url: 'https://feeds.feedburner.com/TechCrunch',        source: 'TechCrunch',      color: 'yellow' },
  { url: 'https://www.technologyreview.com/feed/',          source: 'MIT Tech Review', color: 'blue'   },
];

const AI_KEYWORDS = [
  'AI', 'artificial intelligence', 'machine learning', 'LLM', 'GPT', 'Claude',
  'Gemini', 'OpenAI', 'Anthropic', 'DeepSeek', 'language model', 'neural',
  'chatbot', 'agent', 'automation', 'robotics', 'generative', 'transformer',
  'inference', 'fine-tun', 'benchmark', 'Mistral', 'Llama', 'xAI', 'Grok',
];

const HN_COLORS = ['orange', 'purple', 'green', 'blue', 'red', 'yellow'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function isAIRelated(text) {
  const lower = (text || '').toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function toISODate(dateStr) {
  try { return new Date(dateStr).toISOString().split('T')[0]; }
  catch { return new Date().toISOString().split('T')[0]; }
}

function truncate(str, n) {
  const clean = (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n).replace(/\s\S*$/, '') + '…' : clean;
}

// ─── FETCH HACKER NEWS ────────────────────────────────────────────────────────

async function fetchHackerNews() {
  console.log('Fetching Hacker News...');
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await res.json();
  const stories = [];

  for (const id of ids.slice(0, 60)) {
    if (stories.length >= 8) break;
    try {
      const item = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`).then(r => r.json());
      if (item?.title && item?.url && isAIRelated(item.title)) {
        stories.push({
          id: `hn-${item.id}`,
          title: item.title,
          subtitle: `${item.score} points on Hacker News`,
          color: HN_COLORS[stories.length % HN_COLORS.length],
          date: toISODate(new Date(item.time * 1000).toISOString()),
          url: item.url,
          score: item.score,
          source: 'Hacker News',
        });
      }
    } catch { /* skip malformed items */ }
  }

  console.log(`  → ${stories.length} AI stories from Hacker News`);
  return stories;
}

// ─── FETCH RSS ────────────────────────────────────────────────────────────────

async function fetchRSSFeed(feed) {
  console.log(`Fetching ${feed.source}...`);
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'TilmaAI-NewsBot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await res.text();
    const { parseStringPromise } = await import('xml2js');
    const parsed = await parseStringPromise(xml, { explicitArray: false });
    const channel = parsed?.rss?.channel;
    if (!channel) return [];

    const items = Array.isArray(channel.item) ? channel.item : [channel.item];
    const stories = items
      .filter(item => item && isAIRelated((item.title || '') + ' ' + (item.description || '')))
      .slice(0, 6)
      .map((item, i) => ({
        id: `rss-${slugify(item.title || '')}-${Date.now()}-${i}`,
        title: (item.title || '').replace(/\s+/g, ' ').trim(),
        subtitle: truncate(item.description, 120),
        color: feed.color,
        date: toISODate(item.pubDate),
        url: item.link || item.guid || '',
        score: 0,
        source: feed.source,
      }));

    console.log(`  → ${stories.length} AI stories from ${feed.source}`);
    return stories;
  } catch (e) {
    console.warn(`  ⚠ Failed to fetch ${feed.source}: ${e.message}`);
    return [];
  }
}

// ─── BUILD POST CONTENT ───────────────────────────────────────────────────────

function buildPostContent(story) {
  const lines = [];
  if (story.subtitle && story.source !== 'Hacker News') {
    lines.push(`# Summary\n\n${story.subtitle}\n`);
  }
  lines.push(`# About This Story\n`);
  lines.push(`* **Source:** ${story.source}`);
  lines.push(`* **Published:** ${story.date}`);
  if (story.score) lines.push(`* **HN Score:** ${story.score} points`);
  lines.push('');
  lines.push(`**[Read the full story →](${story.url})**`);
  return lines.join('\n');
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Tilma AI — Daily News Fetch ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // Read existing posts from news.json
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(NEWS_JSON_PATH, 'utf8'));
  } catch {
    console.log('No existing news.json found — starting fresh.');
  }

  const existingIds = new Set(existing.map(p => p.id));

  // Fetch all sources in parallel
  const [hnStories, ...rssResults] = await Promise.all([
    fetchHackerNews(),
    ...RSS_FEEDS.map(fetchRSSFeed),
  ]);

  const allStories = [...rssResults.flat(), ...hnStories];

  if (allStories.length === 0) {
    console.log('⚠ No AI stories found today. news.json unchanged.');
    return;
  }

  // Sort: editorial RSS first, then HN by score
  allStories.sort((a, b) => {
    if (a.source !== 'Hacker News' && b.source === 'Hacker News') return -1;
    if (a.source === 'Hacker News' && b.source !== 'Hacker News') return 1;
    return (b.score || 0) - (a.score || 0);
  });

  // Take up to 3 stories not already in the file
  const fresh = allStories
    .filter(s => !existingIds.has(s.id))
    .slice(0, 3)
    .map(s => ({ id: s.id, title: s.title, subtitle: s.subtitle, color: s.color, date: s.date, content: buildPostContent(s) }));

  if (fresh.length === 0) {
    console.log('No new stories to add — all already present.');
    return;
  }

  // Prepend new posts, trim to MAX_NEWS_POSTS
  const updated = [...fresh, ...existing].slice(0, MAX_NEWS_POSTS);

  fs.writeFileSync(NEWS_JSON_PATH, JSON.stringify(updated, null, 2), 'utf8');
  console.log(`✅ Added ${fresh.length} posts to news.json:`);
  fresh.forEach(p => console.log(`   • ${p.title}`));
}

main().catch(err => {
  console.error('❌ Fatal error:', err.message);
  process.exit(1);
});
