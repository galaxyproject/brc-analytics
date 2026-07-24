import { calculateGridSize } from "@/components/Layout/components/Hero/common/utils";
import {
  Breadcrumb,
  Breadcrumbs,
} from "@databiosphere/findable-ui/lib/components/common/Breadcrumbs/breadcrumbs";
import { BaseComponentProps } from "@databiosphere/findable-ui/lib/components/types";
import { Fragment, JSX, ReactNode } from "react";
import { Hero } from "./components/Hero/hero";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";

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
