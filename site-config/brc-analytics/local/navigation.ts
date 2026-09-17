import { ROUTES as SITE_ROUTES } from "@brc/routes/constants";
import { type Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import { type BreakpointKey } from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";
import { ROUTES } from "@repo/shared/routes/constants";
import { socialMenuItems } from "./socialMedia";

const BREAKPOINT_KEYS: BreakpointKey[] = ["xs", "sm", "md", "lg"];

/** Primary links collapse into the "More" menu at `sm`. */
const HIDDEN_AT_SM: NavLinkItem["visible"] = { sm: false };

/** The "More" menu exists only where the primary links are hidden. */
const VISIBLE_AT_SM = visibleOnly("sm");

/**
 * "Join Us" carries the socials where nothing else does: the header renders its
 * own socials row at `lg`, and the `xs` drawer renders one of its own.
 */
const VISIBLE_AT_SM_MD = visibleOnly("sm", "md");

/**
 * Header navigation links.
 * @param loganSearchEnabled - Whether to show the Logan Search entry.
 * @remarks
 * Kept out of `config.ts` so tests can reach it: `config.ts` transitively
 * imports `next-mdx-remote`, which Jest cannot parse.
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
      { label: "Workflows", url: ROUTES.WORKFLOWS, visible: HIDDEN_AT_SM },
      ...getLoganSearchLinks(loganSearchEnabled, HIDDEN_AT_SM),
      {
        label: "Priority Pathogens",
        url: SITE_ROUTES.PRIORITY_PATHOGENS,
        visible: HIDDEN_AT_SM,
      },
      { label: "Assistant", url: SITE_ROUTES.ASSISTANT },
      {
        label: "More",
        menuItems: [
          { label: "About", url: SITE_ROUTES.ABOUT },
          { label: "Learn", url: SITE_ROUTES.LEARN },
          { label: "Workflows", url: ROUTES.WORKFLOWS },
          ...getLoganSearchLinks(loganSearchEnabled),
          {
            label: "Priority Pathogens",
            url: SITE_ROUTES.PRIORITY_PATHOGENS,
          },
        ],
        url: "",
        visible: VISIBLE_AT_SM,
      },
      {
        label: "Join Us",
        menuItems: socialMenuItems,
        url: "",
        visible: VISIBLE_AT_SM_MD,
      },
    ],
    undefined,
  ];
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
