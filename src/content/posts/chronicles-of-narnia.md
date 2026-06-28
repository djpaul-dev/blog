---
title: The Chronicles of Narnia
date: 2024-07-02
description: >-
  This is a story about a magical land called Narnia, where animals talk and
  mythical creatures roam. The story follows the adventures of four siblings who
  discover a wardrobe that leads to Narnia.
keywords: [narnia, chronicles, story]
draft: false
---

This is the new authoring model: a plain Markdown file with frontmatter at the
top. Write normally — **bold**, _italic_, [links](https://djpaul.dev), lists,
and code all just work.

## Citations

Cite a source inline with Pandoc syntax and the citation renders at build time,
not in the reader's browser [@CitekeyArticle]. Add another and the bibliography
updates itself [@Willighagen_2019_Citation].

The keys come from `references.bib`. If you reference a key that doesn't exist,
the build fails with a clear error instead of shipping a broken span to readers.

## Code

```js
function publish(post) {
  // `git push` — the index, sorting, RSS, and sitemap regenerate themselves.
  return deploy(post);
}
```

> Quotes, images, and everything else from standard Markdown render with your
> existing styling untouched.
