import { APP_KEYS } from "../../../site-config/common/constants";
import { BRC_DEFAULT_DESCRIPTION, BRC_PAGE_META } from "./brc/constants";
import { GA2_DEFAULT_DESCRIPTION, GA2_PAGE_META } from "./ga2/constants";

type AppKey = (typeof APP_KEYS)[keyof typeof APP_KEYS];

/**
 * Returns the default OG description for the given site.
 * @param appKey - App key identifying the site.
 * @returns default description string.
 */
export function getDefaultDescription(appKey?: AppKey): string {
  return appKey === APP_KEYS.GA2
    ? GA2_DEFAULT_DESCRIPTION
    : BRC_DEFAULT_DESCRIPTION;
}

/**
 * Returns entity detail page metadata keyed by entity route for the given site.
 * @param appKey - App key identifying the site.
 * @returns record mapping entity route to page metadata.
 */
export function getEntityDetailMeta(
  appKey?: AppKey
): Record<string, { pageDescription: string; pageTitle: string }> {
  const meta = getPageMeta(appKey);
  const result: Record<string, { pageDescription: string; pageTitle: string }> =
    {
      assemblies: meta.ASSEMBLY_DETAIL,
      organisms: meta.ORGANISM_DETAIL,
    };
  if (appKey !== APP_KEYS.GA2) {
    result["priority-pathogens"] = BRC_PAGE_META.PRIORITY_PATHOGEN_DETAIL;
  }
  return result;
}

/**
 * Returns entity list page metadata keyed by entity route for the given site.
 * @param appKey - App key identifying the site.
 * @returns record mapping entity route to page metadata.
 */
export function getEntityListMeta(
  appKey?: AppKey
): Record<string, { pageDescription: string; pageTitle: string }> {
  const meta = getPageMeta(appKey);
  const result: Record<string, { pageDescription: string; pageTitle: string }> =
    {
      assemblies: meta.ASSEMBLIES,
      organisms: meta.ORGANISMS,
    };
  if (appKey !== APP_KEYS.GA2) {
    result["priority-pathogens"] = BRC_PAGE_META.PRIORITY_PATHOGENS;
  }
  return result;
}

/**
 * Returns the full page metadata object for the given site.
 * @param appKey - App key identifying the site.
 * @returns page metadata constants for BRC or GA2.
 */
export function getPageMeta(
  appKey?: AppKey
): typeof BRC_PAGE_META | typeof GA2_PAGE_META {
  return appKey === APP_KEYS.GA2 ? GA2_PAGE_META : BRC_PAGE_META;
}
