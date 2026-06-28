import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// One Markdown file per post in src/content/posts/.
// The frontmatter below is validated at build time — a typo'd or missing
// field fails the build instead of silently producing a broken page.
const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    description: z.string(),
    keywords: z.array(z.string()).optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { posts };
