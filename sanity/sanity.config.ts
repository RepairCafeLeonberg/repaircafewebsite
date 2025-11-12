import { defineConfig } from 'sanity';
import { deskTool } from 'sanity/desk';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemaTypes';

export default defineConfig({
  name: 'repaircafe-studio',
  title: 'Repair Café Leonberg',
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || process.env.SANITY_PROJECT_ID || '2t9p8f1y',
  dataset: process.env.SANITY_STUDIO_DATASET || process.env.SANITY_DATASET || 'production',
  plugins: [deskTool(), visionTool()],
  schema: {
    types: schemaTypes
  }
});
