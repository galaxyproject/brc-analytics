/**
 * Backend API configuration.
 * Uses NEXT_PUBLIC_BACKEND_URL environment variable which is set per-environment:
 * - dev: https://platform-staging.brc-analytics.org
 * - prod: https://platform-beta.brc-analytics.org
 * - local: http://localhost:8000
 * - docker: "" (empty, uses relative paths with nginx proxy)
 */
export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

export const API_BASE_URL = `${BACKEND_URL}/api/v1`;
