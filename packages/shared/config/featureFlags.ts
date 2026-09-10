/**
 * Feature flag names every site shares, so a read site names its flag through
 * this map rather than repeating the wire string. The single source of truth
 * for flag names: retiring one is a compile error at every use built from here.
 *
 * Which flags a site exposes is per-site — a site's `setFeatureFlags` call
 * allowlists the names it accepts as URL query params (`?demo=true`), and that
 * is what turns a flag on for a browser. Anything unset reads as off, so a site
 * that registers nothing gates everything.
 */
export const FEATURE_FLAGS = {
  DEMO: "demo",
} as const;
