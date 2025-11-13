import { createClient } from '@sanity/client';

const projectId = import.meta.env.SANITY_PROJECT_ID;
const dataset = import.meta.env.SANITY_DATASET;
const apiVersion = import.meta.env.SANITY_API_VERSION ?? '2023-05-26';
const token = import.meta.env.SANITY_READ_TOKEN;
const useCdn = import.meta.env.SANITY_USE_CDN === 'true';

const hasProjectConfig = Boolean(projectId && dataset);
export const isSanityConfigured = hasProjectConfig;

if (!hasProjectConfig) {
  console.warn('Sanity project ID or dataset missing. Please set SANITY_PROJECT_ID and SANITY_DATASET in your environment.');
}

export const sanityClient = hasProjectConfig
  ? createClient({
      projectId: projectId!,
      dataset: dataset!,
      apiVersion,
      useCdn,
      token,
      perspective: token ? 'previewDrafts' : 'published'
    })
  : null;
