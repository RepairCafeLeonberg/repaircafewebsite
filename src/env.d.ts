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
  readonly MAIL_FROM?: string;
  readonly MAIL_BCC?: string;
  readonly SMTP_SECURE?: string;
  readonly BASIC_AUTH_USER?: string;
  readonly BASIC_AUTH_PASS?: string;
  readonly CONTACT_RECIPIENT?: string;
  readonly CONTACT_DEBUG?: string;
  readonly MAILSERVICE_DEBUG?: string;
  readonly MEMBER_API_TOKEN?: string;
  readonly GOOGLE_SHEET_ID?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_PRIVATE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
