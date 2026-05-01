# TILMA AI

**Your field guide to AI-assisted coding.**

A clean, dark editorial-style web app for storing and browsing tips, tricks, and notes across three categories:

- **01 — Prompt Engineering** — Craft better inputs, get better outputs.
- **02 — AI Coding** — Workflows, tools, and power moves.
- **03 — AI News** — Latest from the frontier.

---

## Structure

```
tilma-ai/
├── index.html   — Single-page app shell, all HTML structure
├── style.css    — All styles (CSS variables, layout, components)
├── app.js       — Data, routing, rendering, post management
└── README.md    — This file
```

---

## How to Run

Just open `index.html` in any modern browser. No build step, no server required.

```bash
open index.html
# or
npx serve .
```

---

## Adding Posts via the UI

1. Click any of the 3 panels on the home screen to enter a section.
2. Click **+ New Post** in the top-right corner.
3. Fill in title, description, and content.
4. Pick a color tag, click **Publish Post**.

Posts are saved to `localStorage` and persist across sessions.

---

## Adding Posts in Code

Open `app.js` and find the `INITIAL_POSTS` object near the top:

```js
const INITIAL_POSTS = {
  prompt: [ /* add posts here */ ],
  coding: [ /* add posts here */ ],
  news:   [ /* add posts here */ ],
};
```

Each post follows this shape:

```js
{
  id: 'unique-id',           // string, must be unique
  title: 'Post Title',       // required
  subtitle: 'Short blurb',   // optional
  content: `# Heading\n* bullet`, // Markdown-style content
  color: 'green',            // green | blue | yellow | red | purple | orange
  date: '2025-05-01',        // YYYY-MM-DD
}
```

**Markdown supported in `content`:**
- `# Heading`, `## Heading`, `### Heading`
- `* bullet point`
- `**bold text**`
- `` `inline code` ``
- `> blockquote / callout`
- `---` horizontal rule

> **Note:** If you've used the app before, data in `localStorage` takes priority over `INITIAL_POSTS`. Clear `localStorage` (`localStorage.removeItem('tilma-posts')` in the browser console) to reset to the defaults in code.

---

## Customization

| What | Where |
|---|---|
| Section names & numbers | `SECTIONS` object in `app.js` |
| Accent colors | `:root` CSS variables in `style.css` |
| Fonts | Google Fonts import in `index.html` |
| Panel layout | `.paint-nav` in `style.css` |

---

## Tech

Pure HTML, CSS, and vanilla JS. No frameworks, no dependencies, no build tools.
Data persists via `localStorage`.
# TilmaAI
