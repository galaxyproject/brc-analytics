import { ANCHOR_TARGET } from "@databiosphere/findable-ui/lib/components/Links/common/entities";
import { Button } from "@mui/material";
import {
  Head,
  Headline,
  Section,
  SectionLayout,
  Subhead,
  SubHeadline,
  SubHeadlinePositioner,
} from "./sectionHero.styles";

export const SectionHero = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <Head>
            <span>Analytics for</span>
            <span>pathogen, host, </span>
            <span>and vector data</span>
          </Head>
        </Headline>
        <SubHeadline>
          <SubHeadlinePositioner>
            <Subhead>
              <span>
                BRC Analytics is under active development. This site will
                provide data access and analytical tools for all 785 eukaryotic
                pathogens, host taxa, and vectors previously served by
                VEuPathDB. However, we cannot do this alone.
              </span>
              <span>
                Use the button below to tell us about your usage patterns and
                enroll into our design advisory panel.
              </span>
            </Subhead>
            <Button
              color="hero"
              href="https://docs.google.com/forms/d/e/1FAIpQLSdSj9QtrY1zdUF45V7zGDKY1qKlo8BbSgF0BPfKfSzRTlgsVg/viewform?usp=sf_link"
              target={ANCHOR_TARGET.BLANK}
              variant="contained"
            >
              Get Involved
            </Button>
          </SubHeadlinePositioner>
        </SubHeadline>
      </SectionLayout>
    </Section>
  );
};
