/**
 * Feature flag names specific to this site, alongside the shared registry in
 * `@repo/shared/config/featureFlags` — a flag no other site registers or reads
 * belongs here, so shared code never carries a name only one site knows about.
 *
 * As with the shared registry, a name listed here is only exposed once this
 * site's `setFeatureFlags` call allowlists it.
 */
export const BRC_FEATURE_FLAGS = {
  PANGENOME: "pangenome",
} as const;
