import { type Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import {
  getMenuNavigationLinks,
  getNavigationLinks,
} from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/utils";
import { type NavLinkItem } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/components/Content/components/Navigation/navigation";
import { type BreakpointKey } from "@databiosphere/findable-ui/lib/hooks/useBreakpointHelper";
import { headerNavigation } from "@site-config/brc-analytics/local/navigation";

/** Links that stay in the header at every width the inline nav renders at. */
const PERSISTENT_LABELS = ["Organisms", "Assemblies", "Assistant"];

/** Links that collapse into the "More" menu at `sm`. */
const COLLAPSED_LABELS = [
  "About",
  "Learn",
  "Workflows",
  "Logan Search",
  "Priority Pathogens",
];

/** Every primary link, in display order, at the widths none are collapsed. */
const PRIMARY_LABELS = [
  "About",
  "Learn",
  "Organisms",
  "Assemblies",
  "Workflows",
  "Logan Search",
  "Priority Pathogens",
  "Assistant",
];

const CASES: { breakpoint: BreakpointKey; labels: string[] }[] = [
  // Primary links collapse into "More"; socials arrive as "Join Us", since the
  // header renders no socials row below `lg`.
  { breakpoint: "sm", labels: [...PERSISTENT_LABELS, "More", "Join Us"] },
  // Everything fits, so "More" goes; "Join Us" stays until the socials row does.
  { breakpoint: "md", labels: [...PRIMARY_LABELS, "Join Us"] },
  // The header renders its own socials row here, so "Join Us" goes too.
  { breakpoint: "lg", labels: PRIMARY_LABELS },
];

/**
 * The centre navigation group, which is where the header's links live.
 * @returns Centre group links.
 */
function centreLinks(): NavLinkItem[] | undefined {
  return headerNavigation(true)[1];
}

/**
 * Resolves the labels the drawer lists at a breakpoint.
 * Mirrors the header, which filters each group for the current breakpoint
 * before the drawer flattens them.
 * @param breakpoint - Breakpoint to resolve at.
 * @returns Drawer labels, in display order.
 */
function drawerLabels(breakpoint: BreakpointKey): string[] {
  const [navL, navC, navR] = headerNavigation(true);
  const navigation: Navigation = [
    getNavigationLinks(navL, breakpoint),
    getNavigationLinks(navC, breakpoint),
    getNavigationLinks(navR, breakpoint),
  ];
  return getMenuNavigationLinks(navigation).map((link) => String(link.label));
}

/**
 * Resolves the labels the header shows at a breakpoint.
 * @param breakpoint - Breakpoint to resolve at.
 * @returns Visible labels, in display order.
 */
function visibleLabels(breakpoint: BreakpointKey): string[] {
  return getNavigationLinks(centreLinks(), breakpoint).map((link) =>
    String(link.label)
  );
}

describe("header navigation visibility", () => {
  // Resolved through findable-ui's own getNavigationLinks, so these assert what
  // the header renders rather than restating the config's visibility maps.
  test.each(CASES)(
    "shows the expected links at $breakpoint",
    ({ breakpoint, labels }) => {
      expect(visibleLabels(breakpoint)).toEqual(labels);
    }
  );

  test("the collapsed links are reachable through More at sm", () => {
    const more = getNavigationLinks(centreLinks(), "sm").find(
      (link) => link.label === "More"
    );

    expect(more?.menuItems?.map((item) => String(item.label))).toEqual(
      COLLAPSED_LABELS
    );
  });

  test("the drawer lists the primary links at xs, and no menus", () => {
    // The inline nav does not render at xs, so this is the only surface there.
    // Nothing is collapsed, so "More" and "Join Us" must not appear alongside
    // the links they would otherwise hold.
    expect(drawerLabels("xs")).toEqual(PRIMARY_LABELS);
  });

  test("flattening the sm navigation yields the collapsed link set", () => {
    // Coverage of the flattening itself, not of a rendered surface: the drawer
    // is bound to the widths below the inline nav, so it never renders at sm.
    expect(drawerLabels("sm")).toEqual([
      ...PERSISTENT_LABELS,
      "More",
      "Join Us",
    ]);
  });
});
