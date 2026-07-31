import { SectionContentCards } from "@repo/shared/views/docs/components/SectionContentCards/sectionContentCards";
import { ContentIndexView } from "@repo/shared/views/docs/ContentIndexView/contentIndexView";
import { type JSX } from "react";
import { CARDS } from "./constants";

export const AboutView = (): JSX.Element => {
  return (
    <ContentIndexView
      slotProps={{
        content: {
          content: <SectionContentCards cards={CARDS} />,
          frontmatter: null,
          pageTitle: "About",
          slug: [],
        },
        hero: {
          breadcrumbs: [
            { path: "/", text: "Home" },
            { path: "", text: "About" },
          ],
          head: "About",
          subHead: null,
        },
      }}
    />
  );
};
