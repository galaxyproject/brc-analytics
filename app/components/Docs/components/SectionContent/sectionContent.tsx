import { PANEL_BACKGROUND_COLOR } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/common/entities";
import { Outline } from "@databiosphere/findable-ui/lib/components/Layout/components/ContentLayout/contentLayout.styles";
import { ContentViewProps } from "@databiosphere/findable-ui/lib/views/ContentView/contentView";
import {
  StyledContentGrid,
  StyledContentLayout,
  StyledOutlineGrid,
  StyledPositioner,
} from "./sectionContent.styles";
import { useLayoutDimensions } from "@databiosphere/findable-ui/lib/providers/layoutDimensions/hook";
import { StaticProps } from "../../../../docs/common/staticGeneration/types";
import { Section } from "../../../../components/content/content.styles";

export const SectionContent = ({
  content,
  outline,
  slug,
}: Omit<StaticProps, "mdxSource" | "outline"> &
  Pick<ContentViewProps, "content" | "outline">): JSX.Element => {
  const { dimensions } = useLayoutDimensions();
  return (
    <Section border>
      <StyledContentLayout
        hasNavigation={false}
        panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
      >
        <StyledContentGrid
          headerHeight={0}
          panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
        >
          {content}
        </StyledContentGrid>
        {outline && (
          <StyledOutlineGrid
            key={slug.join("")}
            headerHeight={0}
            panelColor={PANEL_BACKGROUND_COLOR.DEFAULT}
          >
            <StyledPositioner headerHeight={dimensions.header.height}>
              <Outline>{outline}</Outline>
            </StyledPositioner>
          </StyledOutlineGrid>
        )}
      </StyledContentLayout>
    </Section>
  );
};
