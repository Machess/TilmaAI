// ===== TILMA AI — APP.JS =====

// ─── DATA STORE ───────────────────────────────────────────────────────────────
const SECTIONS = {
  prompt: { label: 'Prompt Engineering', num: '01', accent: 'prompt' },
  coding: { label: 'AI Coding',          num: '02', accent: 'coding' },
  news:   { label: 'AI News',            num: '03', accent: 'news'   },
};

// Initial posts data — add new posts here or via the UI
const INITIAL_POSTS = {
  prompt: [],
  news: [],
  coding: [
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
    }
  ],
};

// Load from localStorage or use initial data
function loadData() {
  try {
    const saved = localStorage.getItem('tilma-posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  } catch {
    return INITIAL_POSTS;
  }
}

function saveData(data) {
  try {
    localStorage.setItem('tilma-posts', JSON.stringify(data));
  } catch {}
}

let DB = loadData();
let currentSection = null;
let selectedColor = 'green';

// ─── DOM REFS ─────────────────────────────────────────────────────────────────
const splashEl       = document.getElementById('splash');
const sectionPageEl  = document.getElementById('section-page');
const postPageEl     = document.getElementById('post-page');
const postsGridEl    = document.getElementById('posts-grid');
const emptyStateEl   = document.getElementById('empty-state');
const sectionNumEl   = document.getElementById('section-num');
const sectionTitleEl = document.getElementById('section-title');
const modalOverlay   = document.getElementById('modal-overlay');
const postArticleEl  = document.getElementById('post-article');
const postCatTagEl   = document.getElementById('post-cat-tag');

// ─── NAVIGATION ──────────────────────────────────────────────────────────────
function showPage(pageEl) {
  [splashEl, sectionPageEl, postPageEl].forEach(p => p.classList.remove('active'));
  pageEl.classList.add('active');
}

document.querySelectorAll('.paint-panel').forEach(panel => {
  panel.addEventListener('click', () => {
    const section = panel.dataset.section;
    openSection(section);
  });
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
  const posts = DB[section] || [];
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
  const post = DB[section][idx];
  const meta = SECTIONS[section];
  postCatTagEl.textContent = meta.label;

  postArticleEl.innerHTML = `
    <h1 class="article-title">${escHtml(post.title)}</h1>
    <div class="article-subtitle">${escHtml(post.subtitle || '')} — ${formatDate(post.date)}</div>
    <div class="article-body">${markdownToHtml(post.content || '')}</div>
  `;

  showPage(postPageEl);
}

// ─── MARKDOWN RENDERER ───────────────────────────────────────────────────────
function markdownToHtml(md) {
  let html = md
    // Escape HTML first
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Horizontal rule
    .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:2rem 0">')

    // Headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')

    // Blockquotes (our "callout" style)
    .replace(/^&gt; \*\*(.+?)\*\*(.*)$/gm, '<div class="callout"><strong>$1</strong>$2</div>')
    .replace(/^&gt; (.+)$/gm, '<div class="callout">$1</div>')

    // Inline code
    .replace(/`([^`]+)`/g, '<code>$1</code>')

    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

    // Bullet list items — collect them
    .replace(/^\* (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive <li> in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, match => `<ul>${match}</ul>`);

  // Paragraphs: lines that are not block elements
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

// ─── ADD POST MODAL ───────────────────────────────────────────────────────────
document.getElementById('add-post-btn').addEventListener('click', openModal);
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-cancel').addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

document.querySelectorAll('.color-dot').forEach(dot => {
  dot.addEventListener('click', () => {
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
    dot.classList.add('selected');
    selectedColor = dot.dataset.color;
  });
});

function openModal() {
  document.getElementById('new-post-title').value = '';
  document.getElementById('new-post-subtitle').value = '';
  document.getElementById('new-post-content').value = '';
  selectedColor = 'green';
  document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
  document.querySelector('.color-dot[data-color="green"]').classList.add('selected');
  modalOverlay.classList.add('open');
  setTimeout(() => document.getElementById('new-post-title').focus(), 100);
}

function closeModal() {
  modalOverlay.classList.remove('open');
}

document.getElementById('modal-submit').addEventListener('click', () => {
  const title   = document.getElementById('new-post-title').value.trim();
  const subtitle = document.getElementById('new-post-subtitle').value.trim();
  const content = document.getElementById('new-post-content').value.trim();

  if (!title) {
    document.getElementById('new-post-title').focus();
    document.getElementById('new-post-title').style.borderColor = 'var(--red)';
    setTimeout(() => document.getElementById('new-post-title').style.borderColor = '', 1500);
    return;
  }

  const post = {
    id: `${currentSection}-${Date.now()}`,
    title,
    subtitle,
    content,
    color: selectedColor,
    date: new Date().toISOString().split('T')[0],
  };

  if (!DB[currentSection]) DB[currentSection] = [];
  DB[currentSection].unshift(post);
  saveData(DB);
  renderPosts(currentSection);
  closeModal();
});

// ─── KEYBOARD ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(dateStr) {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr || '';
  }
}
