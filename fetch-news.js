// scripts/fetch-news.js
// Fetches AI news from Hacker News API and MIT Tech Review RSS.
// Filters for AI relevance, picks the 3 best, injects into app.js.
// No API keys. No cost. Runs daily via GitHub Actions at 06:00 UTC.

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { parseStringPromise } from 'xml2js';

// ─── CONFIG ───────────────────────────────────────────────────────────────────

const APP_JS_PATH = path.resolve('app.js');
const MAX_NEWS_POSTS = 20; // trim oldest beyond this to keep app.js tidy

// RSS feeds — all free, no auth required
const RSS_FEEDS = [
  {
    url: 'https://feeds.feedburner.com/TechCrunch',
    source: 'TechCrunch',
    color: 'yellow',
  },
  {
    url: 'https://www.technologyreview.com/feed/',
    source: 'MIT Tech Review',
    color: 'blue',
  },
];

// Keywords used to filter for AI relevance (case-insensitive)
const AI_KEYWORDS = [
  'AI', 'artificial intelligence', 'machine learning', 'LLM', 'GPT', 'Claude',
  'Gemini', 'OpenAI', 'Anthropic', 'DeepSeek', 'language model', 'neural',
  'chatbot', 'agent', 'automation', 'robotics', 'generative', 'transformer',
  'inference', 'fine-tun', 'benchmark', 'Mistral', 'Llama', 'xAI', 'Grok',
];

// Colors cycle for HN posts
const HN_COLORS = ['orange', 'purple', 'green', 'blue', 'red', 'yellow'];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function isAIRelated(text) {
  const lower = (text || '').toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function toISODate(dateStr) {
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

function truncate(str, n) {
  if (!str) return '';
  const clean = str.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n).replace(/\s\S*$/, '') + '…' : clean;
}

// Escape backticks and backslashes for safe JS template literal embedding
function escapeForTemplateLiteral(str) {
  return (str || '').replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

// Serialize a post object to JS source string
function postToSource(post) {
  return `    {
      id: '${post.id}',
      title: '${post.title.replace(/'/g, "\\'")}',
      subtitle: '${post.subtitle.replace(/'/g, "\\'")}',
      color: '${post.color}',
      date: '${post.date}',
      content: \`${escapeForTemplateLiteral(post.content)}\`,
    }`;
}

// ─── FETCH HACKER NEWS ────────────────────────────────────────────────────────

async function fetchHackerNews() {
  console.log('Fetching Hacker News top stories...');
  const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = await res.json();

  const stories = [];
  // Check top 60 stories, stop once we have enough AI ones
  for (const id of ids.slice(0, 60)) {
    if (stories.length >= 8) break;
    try {
      const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const item = await itemRes.json();
      if (item && item.title && item.url && isAIRelated(item.title)) {
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
    } catch (e) {
      // skip malformed items silently
    }
  }

  console.log(`  → Found ${stories.length} AI-related HN stories`);
  return stories;
}

// ─── FETCH RSS ────────────────────────────────────────────────────────────────

async function fetchRSSFeed(feed) {
  console.log(`Fetching RSS: ${feed.source}...`);
  try {
    const res = await fetch(feed.url, {
      headers: { 'User-Agent': 'TilmaAI-NewsBot/1.0' },
      signal: AbortSignal.timeout(10000),
    });
    const xml = await res.text();
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

    console.log(`  → Found ${stories.length} AI-related stories from ${feed.source}`);
    return stories;
  } catch (e) {
    console.warn(`  ⚠ Failed to fetch ${feed.source}: ${e.message}`);
    return [];
  }
}

// ─── BUILD POST CONTENT ───────────────────────────────────────────────────────

function buildPostContent(story) {
  const lines = [];

  if (story.subtitle && story.subtitle !== `${story.score} points on Hacker News`) {
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

// ─── DEDUPLICATION ────────────────────────────────────────────────────────────

function extractExistingIds(appJsContent) {
  const matches = appJsContent.match(/id:\s*['"`]([^'"`]+)['"`]/g) || [];
  return new Set(matches.map(m => m.replace(/id:\s*['"`]([^'"`]+)['"`]/, '$1')));
}

// ─── INJECT INTO APP.JS ───────────────────────────────────────────────────────

function injectPosts(newPosts) {
  let content = fs.readFileSync(APP_JS_PATH, 'utf8');

  const existingIds = extractExistingIds(content);

  // Filter out any stories already present
  const fresh = newPosts.filter(p => !existingIds.has(p.id));

  if (fresh.length === 0) {
    console.log('No new stories to inject — all already present.');
    return;
  }

  // Build full post objects with content
  const postsToAdd = fresh.slice(0, 3).map(story => ({
    ...story,
    content: buildPostContent(story),
  }));

  // Serialize to JS source
  const newPostsSource = postsToAdd.map(postToSource).join(',\n') + ',';

  // Find the injection marker comment and insert after it
  const MARKER = '// ↓ New posts are prepended here automatically each day by GitHub Actions';
  if (!content.includes(MARKER)) {
    console.error('❌ Injection marker not found in app.js. Aborting.');
    process.exit(1);
  }

  const insertAfter = content.indexOf(MARKER) + MARKER.length;
  const nextLine = content.indexOf('\n', insertAfter);
  content = content.slice(0, nextLine + 1) + newPostsSource + '\n' + content.slice(nextLine + 1);

  // Trim oldest posts beyond MAX_NEWS_POSTS
  // Count how many news post objects exist now
  const newsSection = content.match(/news:\s*\[([\s\S]*?)\n  \],/);
  if (newsSection) {
    const postCount = (newsSection[1].match(/id:/g) || []).length;
    if (postCount > MAX_NEWS_POSTS) {
      console.log(`  Trimming news: ${postCount} posts → ${MAX_NEWS_POSTS} max`);
      // Find and remove the last post object(s) beyond the limit
      // Simple approach: find last N occurrences of the closing brace pattern
      let trimContent = newsSection[1];
      const postMatches = [...trimContent.matchAll(/\{\s*\n\s+id:/g)];
      if (postMatches.length > MAX_NEWS_POSTS) {
        const cutAt = postMatches[MAX_NEWS_POSTS].index;
        trimContent = trimContent.slice(0, cutAt).trimEnd();
        content = content.replace(newsSection[1], trimContent + '\n  ');
      }
    }
  }

  fs.writeFileSync(APP_JS_PATH, content, 'utf8');
  console.log(`✅ Injected ${postsToAdd.length} new posts into app.js:`);
  postsToAdd.forEach(p => console.log(`   • ${p.title} (${p.source})`));
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Tilma AI — Daily News Fetch ===');
  console.log(`Time: ${new Date().toISOString()}`);

  // install xml2js if not present (GitHub Actions fresh env)
  try {
    await import('xml2js');
  } catch {
    console.log('xml2js not found — installing...');
    const { execSync } = await import('child_process');
    execSync('npm install xml2js --no-save', { stdio: 'inherit' });
  }

  const { parseStringPromise: psp } = await import('xml2js');
  // patch the module-level reference
  Object.assign(global, { parseStringPromise: psp });

  try {
    // Fetch from all sources in parallel
    const [hnStories, ...rssResults] = await Promise.all([
      fetchHackerNews(),
      ...RSS_FEEDS.map(fetchRSSFeed),
    ]);

    const rssStories = rssResults.flat();
    const allStories = [...rssStories, ...hnStories];

    if (allStories.length === 0) {
      console.log('⚠ No AI stories found today. app.js unchanged.');
      return;
    }

    // Sort: RSS first (editorial quality), then HN by score
    allStories.sort((a, b) => {
      if (a.source !== 'Hacker News' && b.source === 'Hacker News') return -1;
      if (a.source === 'Hacker News' && b.source !== 'Hacker News') return 1;
      return (b.score || 0) - (a.score || 0);
    });

    console.log(`\nTotal AI stories found: ${allStories.length}`);
    injectPosts(allStories);

  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    process.exit(1); // non-zero exit → GitHub Actions marks the run as failed
  }
}

main();
