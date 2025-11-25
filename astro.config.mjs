import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel/serverless';

// https://docs.astro.build/reference/configuration-reference/
export default defineConfig({
  adapter: vercel(),
  integrations: [
    tailwind({ applyBaseStyles: false }),
    react()
  ],
  prefetch: true,
  output: 'hybrid'
});
