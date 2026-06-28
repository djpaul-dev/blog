# Development & Authoring Guide

This blog is built with [Astro](https://astro.build), authored in Markdown, with
citations rendered at build time. This file documents the new write-and-publish
workflow. (The original `README.md` is left as-is.)

---

## Writing a new post

1. Create `src/content/posts/my-post.md` (the filename becomes the URL slug):

   ```markdown
   ---
   title: My Post Title
   date: 2026-06-27
   description: One-line summary shown on the homepage and in RSS.
   keywords: [optional, tags]
   draft: false        # true = visible in `npm run dev` but excluded from the live build
   ---

   Write in Markdown. **Bold**, _italic_, [links](https://djpaul.dev), lists,
   code blocks, images, and blockquotes all just work.

   Cite a source with Pandoc syntax: [@CitekeyArticle]. It renders as an APA
   parenthetical and the bibliography is generated automatically.
   ```

2. If you cited something, add the entry to `references.bib` (BibTeX). A citation
   key that isn't in the file **fails the build** with a clear error — no broken
   citations ever reach readers.

3. Preview locally: `npm run dev` → http://localhost:4321

4. Publish: commit and push to `main`. GitHub Actions builds and deploys
   automatically. The homepage list, sorting, RSS feed, and sitemap regenerate
   themselves — no manual editing of the index.

## Commands

| Command           | Action                                            |
| ----------------- | ------------------------------------------------- |
| `npm install`     | Install dependencies (first time)                 |
| `npm run dev`     | Local dev server with live reload (drafts shown)  |
| `npm run build`   | Production build to `dist/`                        |
| `npm run preview` | Serve the production build locally                 |

## How it's wired

- **`src/content/posts/`** — your Markdown posts (the only thing you edit to publish).
- **`references.bib`** — global bibliography; `rehype-citation` resolves `[@key]`
  citations into formatted APA text + a `References` section **at build time**
  (no client-side JS, fast, SEO-friendly).
- **`src/layouts/` + `src/components/`** — the shared `<head>`, analytics, and
  footer live here once, instead of being copy-pasted into every page.
- **`src/pages/index.astro`** — homepage; auto-generates the post list from the
  collection, newest first, drafts excluded.
- **`public/assets/`** — CSS, fonts, and images, served verbatim (same paths as before).
- **`.github/workflows/deploy.yml`** — build + deploy to GitHub Pages on push to `main`.
- **`legacy/`** — the previous hand-rolled HTML site and Quill admin tool, kept
  for reference. Not part of the build; safe to delete once you're comfortable.

## One-time GitHub setup

In the repo settings → **Pages**, set **Source** to **GitHub Actions** (instead of
"Deploy from a branch"). The `CNAME` (`bitstream.djpaul.dev`) ships from
`public/CNAME`, so the custom domain is preserved.
