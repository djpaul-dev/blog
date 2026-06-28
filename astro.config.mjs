import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeCitation from 'rehype-citation';

// https://astro.build
export default defineConfig({
  site: 'https://bitstream.djpaul.dev',
  integrations: [sitemap()],
  markdown: {
    // Citations are resolved at BUILD time from references.bib.
    // Write `[@CitekeyArticle]` in any post; a missing key fails the build
    // loudly instead of shipping a broken span to readers.
    rehypePlugins: [
      [
        rehypeCitation,
        {
          bibliography: './references.bib',
          csl: 'apa',
          linkCitations: true,
          lang: 'en-US',
          inlineClass: ['citation'],
        },
      ],
    ],
  },
});
