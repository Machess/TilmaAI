// ===== TILMA AI — APP.JS =====
// Prompt + Coding posts: data/prompt.json & data/coding.json (edit & push to update)
// News posts: fetched live from Hacker News + RSS on every section open

// ─── LEADERBOARD (update from artificialanalysis.ai/leaderboards/models) ─────
const LEADERBOARD = {
  updatedAt: 'May 2026',
  models: [
    { rank: 1, model: 'GPT-5.5',         creator: 'OpenAI',    score: 60 },
    { rank: 2, model: 'GPT-5.5 (high)',  creator: 'OpenAI',    score: 59 },
    { rank: 3, model: 'Claude Opus 4.7', creator: 'Anthropic', score: 57 },
    { rank: 4, model: 'Gemini 3.1 Pro',  creator: 'Google',    score: 57 },
    { rank: 5, model: 'GPT-5.4',         creator: 'OpenAI',    score: 57 },
  ],
};

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

const AI_KEYWORDS = [
  'AI', 'artificial intelligence', 'machine learning', 'LLM', 'GPT', 'Claude',
  'Gemini', 'OpenAI', 'Anthropic', 'DeepSeek', 'language model', 'neural',
  'chatbot', 'agent', 'automation', 'robotics', 'generative', 'transformer',
  'inference', 'benchmark', 'Mistral', 'Llama', 'xAI', 'Grok', 'Copilot',
  'foundation model', 'multimodal', 'reasoning', 'model release',
];

const RSS_FEEDS = [
  // TechCrunch AI-specific tag feed (direct, not FeedBurner which was shut down in 2023)
  { url: 'https://techcrunch.com/category/artificial-intelligence/feed/', source: 'TechCrunch', color: 'yellow' },
  // VentureBeat — reliable feed, strong AI coverage
  { url: 'https://venturebeat.com/feed/',                                 source: 'VentureBeat', color: 'blue'   },
  // Wired AI section
  { url: 'https://www.wired.com/feed/category/artificial-intelligence/latest/rss', source: 'Wired', color: 'purple' },
];

const HN_COLORS = ['orange', 'purple', 'green', 'blue', 'red', 'yellow'];

// ─── SECTION META ─────────────────────────────────────────────────────────────
const SECTIONS = {
  prompt: { label: 'Prompt Engineering', num: '01', accent: 'prompt', file: 'data/prompt.json', live: false },
  coding: { label: 'AI Coding',          num: '02', accent: 'coding', file: 'data/coding.json', live: false },
  news:   { label: 'AI News',            num: '03', accent: 'news',   file: 'data/news.json',   live: true  },
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentSection = null;
let currentPage    = 1;
const POSTS_CACHE  = {};  // { section: [posts] }

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const splashEl       = document.getElementById('splash');
const sectionPageEl  = document.getElementById('section-page');
const postPageEl     = document.getElementById('post-page');
const postsGridEl    = document.getElementById('posts-grid');
const emptyStateEl   = document.getElementById('empty-state');
const paginatorEl    = document.getElementById('paginator');
const pagePrevEl     = document.getElementById('page-prev');
const pageNextEl     = document.getElementById('page-next');
const pagePillsEl    = document.getElementById('page-pills');
const sectionNumEl   = document.getElementById('section-num');
const sectionTitleEl = document.getElementById('section-title');
const postArticleEl  = document.getElementById('post-article');
const postCatTagEl   = document.getElementById('post-cat-tag');
const refreshBtn     = document.getElementById('refresh-btn');

// ─── NAVIGATION ───────────────────────────────────────────────────────────────
function showPage(pageEl) {
  [splashEl, sectionPageEl, postPageEl].forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
}

document.querySelectorAll('.paint-panel').forEach(panel => {
  panel.addEventListener('click', () => openSection(panel.dataset.section));
});

document.getElementById('back-btn').addEventListener('click', () => {
  document.body.className = '';
  showPage(splashEl);
});

document.getElementById('post-back-btn').addEventListener('click', () => {
  showPage(sectionPageEl);
});

async function openSection(section) {
  currentSection = section;
  currentPage    = 1;
  const meta = SECTIONS[section];
  sectionNumEl.textContent = meta.num;
  sectionTitleEl.textContent = meta.label;
  document.body.className = `section-${meta.accent}`;
  showPage(sectionPageEl);
  await renderPosts(section);
}

// ─── REFRESH BUTTON ───────────────────────────────────────────────────────────
refreshBtn.addEventListener('click', async () => {
  if (refreshBtn.classList.contains('spinning')) return;
  refreshBtn.classList.add('spinning');
  delete POSTS_CACHE[currentSection];  // bust cache for this section
  currentPage = 1;
  await renderPosts(currentSection);
  refreshBtn.classList.remove('spinning');
});

// ─── FETCH: JSON (prompt / coding) ────────────────────────────────────────────
async function fetchJSON(section) {
  if (POSTS_CACHE[section]) return POSTS_CACHE[section];
  try {
    const res = await fetch(`${SECTIONS[section].file}?v=${Date.now()}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const posts = await res.json();
    POSTS_CACHE[section] = posts;
    return posts;
  } catch (err) {
    console.error(`Failed to load ${section} posts:`, err);
    return [];
  }
}

// ─── FETCH: LIVE NEWS (HN + RSS via rss2json) ─────────────────────────────────
function isAIRelated(text) {
  const lower = (text || '').toLowerCase();
  return AI_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
}

function toISODate(dateStr) {
  try { return new Date(dateStr).toISOString().split('T')[0]; }
  catch { return new Date().toISOString().split('T')[0]; }
}

function truncate(str, n) {
  const clean = (str || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n).replace(/\s\S*$/, '') + '…' : clean;
}

async function fetchHackerNews() {
  try {
    const ids = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
      .then(r => r.json());
    const stories = [];
    for (const id of ids.slice(0, 80)) {
      if (stories.length >= 10) break;
      try {
        const item = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then(r => r.json());
        if (item?.title && item?.url && isAIRelated(item.title)) {
          stories.push({
            id:       `hn-${item.id}`,
            title:    item.title,
            subtitle: `${item.score} points · Hacker News`,
            color:    HN_COLORS[stories.length % HN_COLORS.length],
            date:     toISODate(new Date(item.time * 1000).toISOString()),
            url:      item.url,
            score:    item.score,
            source:   'Hacker News',
            content:  buildNewsContent({ title: item.title, url: item.url, source: 'Hacker News', score: item.score, date: toISODate(new Date(item.time * 1000).toISOString()) }),
          });
        }
      } catch { /* skip */ }
    }
    return stories;
  } catch (err) {
    console.warn('HN fetch failed:', err.message);
    return [];
  }
}

async function fetchRSSFeed(feed) {
  const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}&count=20`;
  try {
    const res = await fetch(proxy);

    // Log the HTTP status so broken feeds are immediately visible in the console
    if (!res.ok) {
      console.warn(`[RSS] ${feed.source} — HTTP ${res.status} (${res.statusText}) for ${feed.url}`);
      return [];
    }

    const data = await res.json();

    // rss2json returns status:'error' with a message when it can't parse the feed
    if (data.status !== 'ok') {
      console.warn(`[RSS] ${feed.source} — rss2json error: "${data.message || 'unknown'}" for ${feed.url}`);
      return [];
    }

    if (!data.items?.length) {
      console.warn(`[RSS] ${feed.source} — feed returned 0 items`);
      return [];
    }

    const filtered = data.items
      .filter(item => isAIRelated((item.title || '') + ' ' + (item.description || '')))
      .slice(0, 8);

    console.log(`[RSS] ${feed.source} — ${filtered.length} AI stories from ${data.items.length} total`);

    return filtered.map((item, i) => ({
      id:       `rss-${feed.source.replace(/\s/g, '-').toLowerCase()}-${Date.now()}-${i}`,
      title:    (item.title || '').replace(/\s+/g, ' ').trim(),
      subtitle: truncate(item.description, 130),
      color:    feed.color,
      date:     toISODate(item.pubDate),
      url:      item.link || '',
      score:    0,
      source:   feed.source,
      content:  buildNewsContent({ title: item.title, subtitle: truncate(item.description, 200), url: item.link, source: feed.source, date: toISODate(item.pubDate) }),
    }));

  } catch (err) {
    // Network error, CORS, or JSON parse failure
    console.warn(`[RSS] ${feed.source} — fetch threw: ${err.message} (url: ${feed.url})`);
    return [];
  }
}

function buildNewsContent({ title, subtitle, url, source, score, date }) {
  const lines = [];
  if (subtitle && source !== 'Hacker News') lines.push(`# Summary\n\n${subtitle}\n`);
  lines.push(`# Story Details\n`);
  lines.push(`* **Source:** ${source}`);
  lines.push(`* **Published:** ${date}`);
  if (score) lines.push(`* **HN Score:** ${score} points`);
  lines.push('');
  if (url) lines.push(`**[Read the full story →](${url})**`);
  return lines.join('\n');
}

async function fetchLiveNews() {
  if (POSTS_CACHE['news']) return POSTS_CACHE['news'];

  // Fetch HN + all RSS feeds in parallel
  const [hnStories, ...rssResults] = await Promise.all([
    fetchHackerNews(),
    ...RSS_FEEDS.map(fetchRSSFeed),
  ]);

  const rssStories = rssResults.flat();

  if (hnStories.length === 0 && rssStories.length === 0) {
    // All live fetches failed — fall back to news.json
    console.warn('All live fetches failed — loading fallback news.json');
    try {
      const res = await fetch(`data/news.json?v=${Date.now()}`);
      const posts = await res.json();
      POSTS_CACHE['news'] = posts;
      return posts;
    } catch {
      return [];
    }
  }

  // Sort: RSS editorial first, then HN by score
  const all = [...rssStories, ...hnStories].sort((a, b) => {
    if (a.source !== 'Hacker News' && b.source === 'Hacker News') return -1;
    if (a.source === 'Hacker News' && b.source !== 'Hacker News') return 1;
    return (b.score || 0) - (a.score || 0);
  });

  // Deduplicate by id
  const seen = new Set();
  const posts = all.filter(p => seen.has(p.id) ? false : seen.add(p.id));

  POSTS_CACHE['news'] = posts;
  return posts;
}

// ─── FETCH DISPATCHER ────────────────────────────────────────────────────────
async function fetchPosts(section) {
  return SECTIONS[section].live ? fetchLiveNews() : fetchJSON(section);
}

// ─── RENDER POSTS + PAGINATION ────────────────────────────────────────────────
async function renderPosts(section) {
  postsGridEl.innerHTML = '<div class="loading-state">Loading…</div>';
  postsGridEl.style.display = 'grid';
  emptyStateEl.style.display = 'none';
  paginatorEl.style.display = 'none';

  const allPosts = await fetchPosts(section);
  postsGridEl.innerHTML = '';

  if (allPosts.length === 0) {
    emptyStateEl.style.display = 'flex';
    postsGridEl.style.display = 'none';
    return;
  }

  const totalPages = Math.ceil(allPosts.length / PAGE_SIZE);
  currentPage      = Math.min(currentPage, totalPages);
  const start      = (currentPage - 1) * PAGE_SIZE;
  const pagePosts  = allPosts.slice(start, start + PAGE_SIZE);

  pagePosts.forEach((post, idx) => {
    const globalIdx = start + idx;
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.color = post.color || 'green';
    card.innerHTML = `
      <div class="post-card-top">
        <div class="post-dot" data-color="${post.color || 'green'}"></div>
        <span class="post-date">${formatDate(post.date)}</span>
      </div>
      <div class="post-card-title">${escHtml(post.title)}</div>
      <div class="post-card-subtitle">${escHtml(post.subtitle || '')}</div>
      <div class="post-card-read">Read post →</div>
    `;
    card.addEventListener('click', () => openPost(section, globalIdx));
    postsGridEl.appendChild(card);
  });

  // Render paginator only if more than one page
  if (totalPages > 1) {
    paginatorEl.style.display = 'flex';
    pagePrevEl.disabled = currentPage === 1;
    pageNextEl.disabled = currentPage === totalPages;

    pagePillsEl.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      const pill = document.createElement('button');
      pill.className = 'page-pill' + (i === currentPage ? ' active' : '');
      pill.textContent = i;
      pill.addEventListener('click', () => goToPage(section, i));
      pagePillsEl.appendChild(pill);
    }
  }
}

function goToPage(section, page) {
  currentPage = page;
  renderPosts(section);
  sectionPageEl.scrollTo({ top: 0, behavior: 'smooth' });
}

pagePrevEl.addEventListener('click', () => {
  if (currentPage > 1) goToPage(currentSection, currentPage - 1);
});
pageNextEl.addEventListener('click', () => {
  const total = Math.ceil((POSTS_CACHE[currentSection]?.length || 0) / PAGE_SIZE);
  if (currentPage < total) goToPage(currentSection, currentPage + 1);
});

// ─── OPEN POST ────────────────────────────────────────────────────────────────
async function openPost(section, idx) {
  const posts = await fetchPosts(section);
  const post  = posts[idx];
  const meta  = SECTIONS[section];

  // News posts that have a URL get a clickable external link header
  const externalLink = post.url
    ? `<a class="post-source-link" href="${escHtml(post.url)}" target="_blank" rel="noopener">
         ${escHtml(post.source || 'Source')} ↗
       </a>`
    : '';

  postCatTagEl.textContent = meta.label;
  postArticleEl.innerHTML = `
    <h1 class="article-title">${escHtml(post.title)}</h1>
    <div class="article-subtitle">
      ${escHtml(post.subtitle || '')} — ${formatDate(post.date)}
      ${externalLink}
    </div>
    <div class="article-body">${markdownToHtml(post.content || '')}</div>
  `;
  showPage(postPageEl);
}

// ─── MARKDOWN RENDERER ────────────────────────────────────────────────────────
function markdownToHtml(md) {
  let html = md
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:2rem 0">')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/^&gt; \*\*(.+?)\*\*(.*)$/gm, '<div class="callout"><strong>$1</strong>$2</div>')
    .replace(/^&gt; (.+)$/gm, '<div class="callout">$1</div>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Markdown links [text](url)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);

  const lines = html.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { result.push(''); continue; }
    const isBlock = /^<(h[1-6]|ul|li|div|hr|blockquote|a)/.test(trimmed);
    result.push(isBlock ? trimmed : `<p>${trimmed}</p>`);
  }
  return result.join('\n');
}

// ─── TICKER ───────────────────────────────────────────────────────────────────
function renderTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;
  const chipsHtml = LEADERBOARD.models.map(m => `
    <div class="ticker-chip">
      <span class="ticker-rank">${String(m.rank).padStart(2, '0')}</span>
      <span class="ticker-model">${m.model}</span>
      <span class="ticker-creator" data-creator="${m.creator}">${m.creator}</span>
      <span class="ticker-score">◆ ${m.score}</span>
    </div>
  `).join('');
  track.innerHTML = chipsHtml + chipsHtml;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch { return dateStr || ''; }
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
renderTicker();
