import { Breadcrumbs } from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { calculateGridSize } from "@repo/shared/components/layout/SectionHero/components/Hero/common/utils";
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
import type { Props } from "./types";

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
