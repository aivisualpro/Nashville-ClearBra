/** App version — bump this with each release. */
export const APP_VERSION = "0.91";

/**
 * Build hash — set automatically by Vercel at build time.
 * Falls back to a timestamp in dev so polling never false-triggers.
 */
export const BUILD_HASH =
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  process.env.NEXT_PUBLIC_BUILD_HASH ||
  "dev";
