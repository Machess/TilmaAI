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
├── index.html                     — Single-page app shell, all HTML structure
├── style.css                      — All styles (CSS variables, layout, components)
├── app.js                         — Routing, rendering, live news fetch, markdown renderer
├── fetch-news.js                  — CI script: fetches HN + RSS, writes data/news.json
├── package.json                   — Dependencies for fetch-news.js
├── .github/workflows/fetch-news.yml — Daily cron that runs fetch-news.js and commits the result
├── data/prompt.json                — Posts for section 01, Prompt Engineering
├── data/coding.json                — Posts for section 02, AI Coding
├── data/news.json                  — Posts for section 03, AI News (fallback if live fetch fails)
└── README.md                       — This file
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

## Adding Posts

`prompt.json` and `coding.json` are static and edited directly — add an entry to the array in `data/prompt.json` or `data/coding.json` and push. Each post follows this shape:

```json
{
  "id": "unique-id",
  "title": "Post Title",
  "subtitle": "Short blurb",
  "content": "# Heading\n* bullet",
  "color": "green",
  "date": "2025-05-01"
}
```

`color` is one of `green | blue | yellow | red | purple | orange`.

**Markdown supported in `content`:**
- `# Heading`, `## Heading`, `### Heading`
- `* bullet point`
- `**bold text**`
- `` `inline code` ``
- `> blockquote / callout`
- `---` horizontal rule
- `[link text](url)`

`data/news.json` is written automatically — see below.

---

## AI News

The "AI News" section fetches Hacker News + RSS (TechCrunch, VentureBeat, Wired) live in the browser every time the section is opened, filtered to AI-related stories. `data/news.json` is only used as a fallback if that live fetch fails.

`data/news.json` itself is kept fresh by [fetch-news.js](fetch-news.js), run daily by [.github/workflows/fetch-news.yml](.github/workflows/fetch-news.yml). To run it locally:

```bash
npm install
npm run fetch-news
```

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

Pure HTML, CSS, and vanilla JS on the client. No frameworks, no build tools.
A small Node script + GitHub Actions workflow keep `data/news.json` fresh server-side.
