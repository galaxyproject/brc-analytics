import { ROUTES as SITE_ROUTES } from "@brc/routes/constants";
import { type Navigation } from "@databiosphere/findable-ui/lib/components/Layout/components/Header/common/entities";
import { ROUTES } from "@repo/shared/routes/constants";

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
      { label: "About", url: SITE_ROUTES.ABOUT },
      { label: "Learn", url: SITE_ROUTES.LEARN },
      { label: "Organisms", url: ROUTES.ORGANISMS },
      { label: "Assemblies", url: ROUTES.GENOMES },
      { label: "Workflows", url: ROUTES.WORKFLOWS },
      ...(loganSearchEnabled
        ? [{ label: "Logan Search", url: SITE_ROUTES.LOGAN_SEARCH }]
        : []),
      {
        label: "Priority Pathogens",
        url: SITE_ROUTES.PRIORITY_PATHOGENS,
      },
      { label: "Assistant", url: SITE_ROUTES.ASSISTANT },
    ],
    undefined,
  ];
}
