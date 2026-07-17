import { calculateGridSize } from "@brc-analytics/core/components/Layout/components/Hero/common/utils";
import { Breadcrumbs } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Fragment, JSX } from "react";
import { Hero } from "./components/Hero/hero";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";
import { Props } from "./types";

export const SectionHero = ({
  breadcrumbs,
  className,
  head,
  subHead,
}: Props): JSX.Element => {
  return (
    <StyledSection className={className}>
      {(height, width): JSX.Element => (
        <Fragment>
          <Hero
            gridSize={calculateGridSize(height)}
            height={height}
            width={width}
          />
          <SectionLayout>
            <Headline>
              <Breadcrumbs breadcrumbs={breadcrumbs} />
              <Head>{head}</Head>
            </Headline>
            {subHead && (
              <SubHeadline>
                <Subhead>{subHead}</Subhead>
              </SubHeadline>
            )}
          </SectionLayout>
        </Fragment>
      )}
    </StyledSection>
  );
};
