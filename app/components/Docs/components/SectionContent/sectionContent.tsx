import { PANEL_BACKGROUND_COLOR } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/common/entities";
import { ContentGrid } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import { ContentViewProps } from "@databiosphere/findable-ui/lib/views/ContentView/contentView";
import { JSX } from "react";
import { Section } from "../../../../components/content/content.styles";
import { StaticProps } from "../../../../docs/common/staticGeneration/types";
import {
  StyledContent,
  StyledContentLayout,
  StyledOutline,
  StyledOutlineGrid,
  StyledPositioner,
} from "./sectionContent.styles";

export const SectionContent = ({
  content,
  frontmatter,
  outline,
  slug,
}: Omit<StaticProps, "mdxSource" | "outline"> &
  Pick<ContentViewProps, "content" | "outline">): JSX.Element => {
  const { contentType } = frontmatter || {};
  return (
    <Section border>
      <StyledContentLayout
        contentType={contentType}
        hasNavigation={false}
        panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
      >
        <ContentGrid
          headerHeight={0}
          panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
        >
          <StyledContent contentType={contentType}>{content}</StyledContent>
        </ContentGrid>
        {outline && (
          <StyledOutlineGrid
            key={slug.join("")}
            contentType={contentType}
            headerHeight={0}
            panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
          >
            <StyledPositioner headerHeight={0}>
              <StyledOutline>{outline}</StyledOutline>
            </StyledPositioner>
          </StyledOutlineGrid>
        )}
      </StyledContentLayout>
    </Section>
  );
};
