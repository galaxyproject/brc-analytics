import { useConfig } from "@databiosphere/findable-ui/lib/hooks/useConfig";
import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { FEATURE_FLAGS } from "@repo/shared/config/featureFlags";
import { type AppSiteConfig } from "@repo/shared/config/types";
import { SectionContentCards } from "@repo/shared/views/docs/components/SectionContentCards/sectionContentCards";
import { ContentIndexView } from "@repo/shared/views/docs/ContentIndexView/contentIndexView";
import { type JSX } from "react";
import { getFilteredCards } from "./utils";

export const LearnView = (): JSX.Element => {
  const isDemoEnabled = useFeatureFlag(FEATURE_FLAGS.DEMO);
  const { config } = useConfig();
  const { loganSearchEnabled = false } = config as AppSiteConfig;
  const cards = getFilteredCards(isDemoEnabled, loganSearchEnabled);
  return (
    <ContentIndexView
      slotProps={{
        content: {
          content: <SectionContentCards cards={cards} />,
          frontmatter: null,
          pageTitle: "Learn",
          slug: [],
        },
        hero: {
          breadcrumbs: [
            { path: "/", text: "Home" },
            { path: "", text: "Learn" },
          ],
          head: "Learn",
          subHead: null,
        },
      }}
    />
  );
};
