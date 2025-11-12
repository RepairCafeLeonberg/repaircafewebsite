import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID ?? '2t9p8f1y';
const dataset = import.meta.env.SANITY_DATASET ?? 'production';
const apiVersion = import.meta.env.SANITY_API_VERSION ?? '2023-05-26';
const token = import.meta.env.SANITY_READ_TOKEN;
const useCdn = import.meta.env.SANITY_USE_CDN === 'true';

export const isSanityConfigured = Boolean(projectId && dataset);

if (!isSanityConfigured) {
  console.warn('Sanity project ID or dataset missing. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment.');
}

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion,
      useCdn,
      token,
      perspective: token ? 'previewDrafts' : 'published'
    })
  : null;
