/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly SANITY_PROJECT_ID?: string;
  readonly SANITY_DATASET?: string;
  readonly SANITY_API_VERSION?: string;
  readonly SANITY_USE_CDN?: string;
  readonly SANITY_READ_TOKEN?: string;
  readonly SANITY_WRITE_TOKEN?: string;
  readonly SMTP_HOST?: string;
  readonly SMTP_PORT?: string;
  readonly SMTP_USER?: string;
  readonly SMTP_PASS?: string;
  readonly SMTP_FROM?: string;
  readonly CONTACT_RECIPIENT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
