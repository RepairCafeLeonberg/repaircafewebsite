import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET;

if (!projectId) {
  throw new Error('Missing Sanity project ID. Please set SANITY_STUDIO_PROJECT_ID or SANITY_PROJECT_ID.');
}

if (!dataset) {
  throw new Error('Missing Sanity dataset. Please set SANITY_STUDIO_DATASET or SANITY_DATASET.');
}

export default defineConfig({
  name: 'repaircafe-studio',
  title: 'Repair Café Leonberg',
  projectId,
  dataset,
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes
  }
});
