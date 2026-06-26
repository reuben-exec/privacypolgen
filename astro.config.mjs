import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://www.privacypolgen.in',
  output: 'static',
  integrations: [
    react(),
    sitemap({
      filter: (page) => {
        // Exclude noindex viewer pages and error pages
        // filter receives the full URL, e.g. https://www.privacypolgen.in/p/
        const path = new URL(page).pathname.replace(/\/$/, '');
        const noindexPaths = ['/p', '/c', '/t', '/404', '/500'];
        if (noindexPaths.some(p => path === p || path.startsWith(p + '/'))) {
          return false;
        }
        return true;
      },
      serialize: (entry) => {
        const url = entry.url.replace(/\/$/, ''); // normalize trailing slash
        const path = new URL(url).pathname;

        // Blog posts: update weekly
        if (path.startsWith('/blog/')) {
          entry.changefreq = 'weekly';
          entry.priority = 0.7;
        }
        // Blog listing
        else if (path === '/blog') {
          entry.changefreq = 'weekly';
          entry.priority = 0.5;
        }
        // Generator pages (high value)
        else if (path.startsWith('/generate')) {
          entry.changefreq = 'monthly';
          entry.priority = 0.8;
        }
        // Homepage
        else if (path === '') {
          entry.changefreq = 'weekly';
          entry.priority = 1.0;
        }
        // Core content pages
        else if (['/about', '/contact', '/pricing', '/examples', '/review'].includes(path)) {
          entry.changefreq = 'monthly';
          entry.priority = 0.6;
        }
        // Legal pages / other static content
        else if (['/privacy', '/terms'].includes(path)) {
          entry.changefreq = 'monthly';
          entry.priority = 0.5;
        }
        // Everything else
        else {
          entry.changefreq = 'monthly';
          entry.priority = 0.5;
        }

        return entry;
      },
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
