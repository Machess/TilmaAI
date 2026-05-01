// ===== TILMA AI — APP.JS =====
// Posts live in data/prompt.json, data/coding.json, data/news.json
// To add, edit, or remove a post — update the relevant JSON file and push.

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

// ─── SECTION META ─────────────────────────────────────────────────────────────
const SECTIONS = {
  prompt: { label: 'Prompt Engineering', num: '01', accent: 'prompt', file: 'data/prompt.json' },
  coding: { label: 'AI Coding',          num: '02', accent: 'coding', file: 'data/coding.json' },
  news:   { label: 'AI News',            num: '03', accent: 'news',   file: 'data/news.json'   },
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentSection = null;
const POSTS_CACHE = {};   // keyed by section, populated on first open

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const splashEl       = document.getElementById('splash');
const sectionPageEl  = document.getElementById('section-page');
const postPageEl     = document.getElementById('post-page');
const postsGridEl    = document.getElementById('posts-grid');
const emptyStateEl   = document.getElementById('empty-state');
const sectionNumEl   = document.getElementById('section-num');
const sectionTitleEl = document.getElementById('section-title');
const postArticleEl  = document.getElementById('post-article');
const postCatTagEl   = document.getElementById('post-cat-tag');

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
  const meta = SECTIONS[section];
  sectionNumEl.textContent = meta.num;
  sectionTitleEl.textContent = meta.label;
  document.body.className = `section-${meta.accent}`;
  showPage(sectionPageEl);
  await renderPosts(section);
}

// ─── FETCH POSTS ──────────────────────────────────────────────────────────────
async function fetchPosts(section) {
  if (POSTS_CACHE[section]) return POSTS_CACHE[section];
  try {
    // Cache-bust so GitHub Pages always serves the latest JSON after a push
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

// ─── RENDER POSTS ─────────────────────────────────────────────────────────────
async function renderPosts(section) {
  postsGridEl.innerHTML = '<div class="loading-state">Loading…</div>';
  emptyStateEl.style.display = 'none';
  postsGridEl.style.display = 'grid';

  const posts = await fetchPosts(section);
  postsGridEl.innerHTML = '';

  if (posts.length === 0) {
    emptyStateEl.style.display = 'flex';
    postsGridEl.style.display = 'none';
    return;
  }

  posts.forEach((post, idx) => {
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
    card.addEventListener('click', () => openPost(section, idx));
    postsGridEl.appendChild(card);
  });
}

// ─── OPEN POST ────────────────────────────────────────────────────────────────
async function openPost(section, idx) {
  const posts = await fetchPosts(section);
  const post  = posts[idx];
  const meta  = SECTIONS[section];
  postCatTagEl.textContent = meta.label;
  postArticleEl.innerHTML = `
    <h1 class="article-title">${escHtml(post.title)}</h1>
    <div class="article-subtitle">${escHtml(post.subtitle || '')} — ${formatDate(post.date)}</div>
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
    .replace(/^\* (.+)$/gm, '<li>$1</li>');

  html = html.replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);

  const lines = html.split('\n');
  const result = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { result.push(''); continue; }
    const isBlock = /^<(h[1-6]|ul|li|div|hr|blockquote)/.test(trimmed);
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
