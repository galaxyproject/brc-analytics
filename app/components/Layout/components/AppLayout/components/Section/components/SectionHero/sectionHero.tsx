import { JSX } from "react";
import {
  Breadcrumb,
  Breadcrumbs,
} from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { Fragment, ReactNode } from "react";
import { calculateGridSize } from "../../../../../Hero/common/utils";
import { Hero } from "./components/Hero/hero";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";
import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";

export interface SectionHeroProps extends BaseComponentProps {
  breadcrumbs: Breadcrumb[];
  head: ReactNode;
  subHead: ReactNode;
}

export const SectionHero = ({
  breadcrumbs,
  className,
  head,
  subHead,
}: SectionHeroProps): JSX.Element => {
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
