/**
 * Feature flag names every site shares, so a read site names its flag through
 * this map rather than repeating the wire string. The single source of truth
 * for shared flag names: retiring one is a compile error at every use built
 * from here. A flag only one site registers and reads belongs in that site's
 * own registry instead.
 *
 * Which flags a site exposes is per-site — a site's `setFeatureFlags` call
 * allowlists the names it accepts as URL query params (`?lmls=true`), and that
 * is what turns a flag on for a browser. Anything unset reads as off.
 */
export const FEATURE_FLAGS = {
  ASSEMBLY_WORKFLOWS: "assembly-workflows",
  HYPHY: "hyphy",
  LMLS: "lmls",
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];
