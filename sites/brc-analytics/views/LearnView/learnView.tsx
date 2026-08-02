import { useFeatureFlag } from "@databiosphere/findable-ui/lib/hooks/useFeatureFlag/useFeatureFlag";
import { SectionContentCards } from "@repo/shared/views/docs/components/SectionContentCards/sectionContentCards";
import { ContentIndexView } from "@repo/shared/views/docs/ContentIndexView/contentIndexView";
import { type JSX } from "react";
import { getFilteredCards } from "./utils";

export const LearnView = (): JSX.Element => {
  const isLmlsEnabled = useFeatureFlag("lmls");
  const cards = getFilteredCards(isLmlsEnabled);
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
