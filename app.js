// ===== TILMA AI — APP.JS =====
// Posts are managed here in code. To add a post:
//   1. Add an object to the relevant array below (prompt / coding / news)
//   2. Commit and push — that's it.

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

// ─── POSTS ────────────────────────────────────────────────────────────────────
// Add new posts by prepending objects to the relevant array.
//
// Post shape:
// {
//   id:       'unique-string',           // required, must be unique across all sections
//   title:    'Post Title',              // required
//   subtitle: 'Short description',       // optional
//   color:    'green',                   // green | blue | yellow | red | purple | orange
//   date:     'YYYY-MM-DD',              // required
//   content:  `markdown string`,         // required — see README for supported syntax
// }

const POSTS = {

  prompt: [
    // ↓ Add new Prompt Engineering posts here
  ],

  coding: [
    // ↓ Add new AI Coding posts here
    {
      id: 'coding-001',
      title: 'Clean Timeline — 32 Tips Grouped for Clarity',
      subtitle: 'Context mastery, smarter prompting, workflow design & advanced power moves for Claude Code.',
      color: 'green',
      date: '2025-05-01',
      content: `# Context Mastery (Most Important)

* Run \`/compact\` regularly — don't wait until things break
* Watch for **context rot** (AI forgetting or contradicting itself)
* Start fresh sessions when needed

> **Why it matters:** Too much context = worse output. Too little = loss of progress.

# Smarter Prompting

* Use keywords like **ultrathink** for deep reasoning
* Set effort level: low / medium / high / max
* Force Claude to ask clarifying questions first

> **Key idea:** Better instructions = better thinking.

# Break Problems Down

* Never ask Claude to solve big problems in one go
* Split tasks into smaller chunks
* Iterate step-by-step

> This mirrors real software engineering.

# Workflow Design (Game Changer)

* Use: **Plans → Specs → Tasks → Code**
* Create handoff documents between sessions
* Think like managing a team, not a tool

> This is how you scale projects.

# Multi-Agent / Parallel Work

* Run multiple Claude sessions at once
* Use Git worktrees for parallel development
* Commit before switching contexts

> **Result:** Faster development + safer experimentation.

# Hidden Commands & Features

* \`/compact\` → compress memory
* \`/copy\` → copy output cleanly
* \`/bug\` → structured bug reports
* **Auto mode** → safe automation

> Many users never discover these.

# Environment Optimization

* Use **voice input** (faster than typing)
* Create terminal aliases
* Customize status bar (track tokens, progress)

> Optimize your speed of interaction.

# Advanced Power Moves

* Use Claude with: Containers, Other AI tools (Gemini, etc.)
* Create reusable **"skills"** (mini workflows)
* Store knowledge in \`CLAUDE.md\`

> You're building your own AI dev system.

# Mindset Shift

* Don't treat Claude like Google
* Treat it like: a junior dev, a collaborator, a system you design

> **Biggest takeaway:** Your workflow matters more than your prompts.

---

# All 32 Tips (Condensed)

## Context & Memory
* Run \`/compact\` early and often
* Restart sessions when quality drops
* Keep context clean and relevant

## Prompting
* Use "ultrathink" for complex tasks
* Set effort level explicitly
* Ask Claude to clarify before acting

## Problem Solving
* Break big problems into small steps
* Iterate instead of expecting perfection
* Use planning before coding

## Workflow
* Create handoff documents
* Use structured pipelines (plan → build → test)
* Think in systems, not prompts

## Multi-Agent Work
* Run multiple Claude sessions
* Use Git worktrees
* Commit checkpoints

## Tools & Commands
* Learn slash commands
* Use auto mode carefully
* Use \`/copy\`, \`/bug\`, etc.

## Optimization
* Use voice input
* Create shortcuts & aliases
* Track token usage

## Advanced
* Combine Claude with other tools
* Use containers for risky tasks
* Build reusable "skills"`,
    },
  ],

  news: [
    // ↓ Add new AI News posts here
  ],

};

// ─── SECTION META ─────────────────────────────────────────────────────────────
const SECTIONS = {
  prompt: { label: 'Prompt Engineering', num: '01', accent: 'prompt' },
  coding: { label: 'AI Coding',          num: '02', accent: 'coding' },
  news:   { label: 'AI News',            num: '03', accent: 'news'   },
};

// ─── STATE ────────────────────────────────────────────────────────────────────
let currentSection = null;

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

function openSection(section) {
  currentSection = section;
  const meta = SECTIONS[section];
  sectionNumEl.textContent = meta.num;
  sectionTitleEl.textContent = meta.label;
  document.body.className = `section-${meta.accent}`;
  renderPosts(section);
  showPage(sectionPageEl);
}

// ─── RENDER POSTS ─────────────────────────────────────────────────────────────
function renderPosts(section) {
  const posts = POSTS[section] || [];
  postsGridEl.innerHTML = '';

  if (posts.length === 0) {
    emptyStateEl.style.display = 'flex';
    postsGridEl.style.display = 'none';
    return;
  }

  emptyStateEl.style.display = 'none';
  postsGridEl.style.display = 'grid';

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
function openPost(section, idx) {
  const post = POSTS[section][idx];
  const meta = SECTIONS[section];
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
