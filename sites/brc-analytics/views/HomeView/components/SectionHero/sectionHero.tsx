import { BUTTON_PROPS } from "@databiosphere/findable-ui/lib/components/common/Button/constants";
import { Button } from "@mui/material";
import { calculateGridSize } from "@repo/shared/components/layout/SectionHero/components/Hero/common/utils";
import { Hero } from "@repo/shared/components/layout/SectionHero/components/Hero/hero";
import { ROUTES } from "@repo/shared/routes/constants";
import { Fragment, type JSX } from "react";
import { Carousel } from "./components/Carousel/carousel";
import {
  Head,
  Headline,
  SectionLayout,
  StyledSection,
  Subhead,
  SubHeadline,
} from "./sectionHero.styles";

export const SectionHero = (): JSX.Element => {
  return (
    <StyledSection>
      {(height, width): JSX.Element => (
        <Fragment>
          <Hero
            gridSize={calculateGridSize(height)}
            height={height}
            width={width}
          />
          <SectionLayout>
            <Headline>
              <Head>
                <span>Analytics for pathogen, </span>
                <span>host, and vector data</span>
              </Head>
              <SubHeadline>
                <Subhead>
                  Comprehensive tools and workflows for exploring and
                  interpreting genomic annotations and functional insights into
                  disease-causing organisms and their carriers
                </Subhead>
                <Button
                  {...BUTTON_PROPS.PRIMARY_LARGE_CONTAINED}
                  href={ROUTES.ORGANISMS}
                >
                  Get started
                </Button>
              </SubHeadline>
            </Headline>
            <Carousel />
          </SectionLayout>
        </Fragment>
      )}
    </StyledSection>
  );
};
