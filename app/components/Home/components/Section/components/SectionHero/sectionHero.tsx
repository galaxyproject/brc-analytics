import { Button } from "@mui/material";
import { Fragment } from "react";
import { ROUTES } from "../../../../../../../routes/constants";
import { calculateGridSize } from "../../../../../Layout/components/Hero/common/utils";
import { Carousel } from "./components/Carousel/carousel";
import { Hero } from "./components/Hero/hero";
import { BUTTON_PROPS } from "./constants";
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
      {(height): JSX.Element => (
        <Fragment>
          <Hero gridSize={calculateGridSize(height)} height={height} />
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
                <Button {...BUTTON_PROPS} href={ROUTES.ORGANISMS}>
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
