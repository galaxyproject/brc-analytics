import { ROUTES as SITE_ROUTES } from "@brc/routes/constants";
import { type Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { type BreakpointKey } from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";
import { ROUTES } from "@repo/shared/routes/constants";
import { SUPPORT_URL } from "./constants";
import { socialMenuItems } from "./socialMedia";

const BREAKPOINT_KEYS: BreakpointKey[] = ["xs", "sm", "md", "lg"];

/** Primary links collapse into the "More" menu at `sm`. */
const HIDDEN_AT_SM: NavLinkItem["visible"] = { sm: false };

/** The collapsed primary links are listed in "More" only at `sm`. */
const VISIBLE_AT_SM = visibleOnly("sm");

/**
 * At `sm` and `md` the header has room for neither "Join Us" nor "Contact Us",
 * so "More" holds them both.
 */
const VISIBLE_AT_SM_MD = visibleOnly("sm", "md");

/**
 * "Join Us" carries the socials at `lg`, in place of a socials row. The `xs`
 * drawer renders a socials row of its own.
 */
const VISIBLE_AT_LG = visibleOnly("lg");

/** "Contact Us" ends the nav at `lg`, and is listed in the `xs` drawer. */
const VISIBLE_AT_XS_LG = visibleOnly("xs", "lg");

/** The support form, opened in a new tab. */
const CONTACT_US: NavLinkItem = {
  label: "Contact Us",
  target: ANCHOR_TARGET.BLANK,
  url: SUPPORT_URL,
};

/** The socials menu. */
const JOIN_US: NavLinkItem = {
  label: "Join Us",
  menuItems: socialMenuItems,
  url: "",
};

/**
 * Returns the Genes navigation link.
 * @param visible - Breakpoints the link is visible at.
 * @returns Genes link.
 */
function getGenesLink(visible?: NavLinkItem["visible"]): NavLinkItem {
  return { label: "Genes", url: ROUTES.GENES, visible };
}

/**
 * Returns the Logan Search navigation link, when the feature is enabled.
 * @param loganSearchEnabled - Whether Logan Search is enabled.
 * @param visible - Breakpoints the link is visible at.
 * @returns Logan Search link, or an empty list when disabled.
 */
function getLoganSearchLinks(
  loganSearchEnabled: boolean,
  visible?: NavLinkItem["visible"]
): NavLinkItem[] {
  if (!loganSearchEnabled) return [];
  return [{ label: "Logan Search", url: SITE_ROUTES.LOGAN_SEARCH, visible }];
}

/**
 * Header navigation links.
 * @param loganSearchEnabled - Whether to show the Logan Search entry.
 * @remarks
 * Kept out of `config.ts` so tests can reach it: `config.ts` transitively
 * imports `next-mdx-remote`, which Jest cannot parse.
 * The Genes entry is always included here; it is gated at runtime by the
 * gene pages feature flag (see the site's `useAppConfig` hook).
 * @returns header navigation.
 */
export function headerNavigation(loganSearchEnabled: boolean): Navigation {
  return [
    undefined,
    [
      { label: "About", url: SITE_ROUTES.ABOUT, visible: HIDDEN_AT_SM },
      { label: "Learn", url: SITE_ROUTES.LEARN, visible: HIDDEN_AT_SM },
      { label: "Organisms", url: ROUTES.ORGANISMS },
      { label: "Assemblies", url: ROUTES.GENOMES },
      getGenesLink(HIDDEN_AT_SM),
      { label: "Workflows", url: ROUTES.WORKFLOWS, visible: HIDDEN_AT_SM },
      ...getLoganSearchLinks(loganSearchEnabled, HIDDEN_AT_SM),
      {
        label: "Priority Pathogens",
        url: SITE_ROUTES.PRIORITY_PATHOGENS,
        visible: HIDDEN_AT_SM,
      },
      { label: "Assistant", url: ROUTES.ASSISTANT },
      {
        label: "More",
        menuItems: [
          ...withVisible(VISIBLE_AT_SM, [
            { label: "About", url: SITE_ROUTES.ABOUT },
            { label: "Learn", url: SITE_ROUTES.LEARN },
            getGenesLink(),
            { label: "Workflows", url: ROUTES.WORKFLOWS },
            ...getLoganSearchLinks(loganSearchEnabled),
            {
              label: "Priority Pathogens",
              url: SITE_ROUTES.PRIORITY_PATHOGENS,
            },
          ]),
          JOIN_US,
          CONTACT_US,
        ],
        url: "",
        visible: VISIBLE_AT_SM_MD,
      },
      { ...JOIN_US, visible: VISIBLE_AT_LG },
      { ...CONTACT_US, visible: VISIBLE_AT_XS_LG },
    ],
    undefined,
  ];
}

/**
 * Returns a visibility map that is true at the given breakpoints and false at
 * every other one.
 * @param breakpoints - Breakpoints the item is visible at.
 * @returns visibility map covering every breakpoint.
 */
function visibleOnly(...breakpoints: BreakpointKey[]): NavLinkItem["visible"] {
  return Object.fromEntries(
    BREAKPOINT_KEYS.map((key): [BreakpointKey, boolean] => [
      key,
      breakpoints.includes(key),
    ])
  );
}

/**
 * Returns the links, each visible only at the given breakpoints.
 * @param visible - Breakpoints the links are visible at.
 * @param links - Links.
 * @returns links with the visibility applied.
 */
function withVisible(
  visible: NavLinkItem["visible"],
  links: NavLinkItem[]
): NavLinkItem[] {
  return links.map((link) => ({ ...link, visible }));
}
