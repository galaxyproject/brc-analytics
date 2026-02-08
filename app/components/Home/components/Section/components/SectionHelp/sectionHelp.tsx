import { JSX } from "react";
import { Link as DXLink } from "@databiosphere/findable-ui/lib/components/Links/components/Link/link";
import { Questions } from "./components/Questions/questions";
import {
  Headline,
  Section,
  SectionLayout,
  StyledSectionSubTitle,
  StyledSectionTitle,
} from "./sectionHelp.styles";

export const SectionHelp = (): JSX.Element => {
  return (
    <Section>
      <SectionLayout>
        <Headline>
          <StyledSectionTitle>Your questions, answered</StyledSectionTitle>
          <StyledSectionSubTitle>
            If you need further assistance, feel free to reach out to us at{" "}
            <DXLink
              label="help@brc-analytics.org"
              url="mailto:help@brc-analytics.org"
            />
            , or join discussions on the{" "}
            <DXLink
              label="Discourse forum"
              url="https://help.brc-analytics.org/"
            />
            . We&#39;re here to help!
          </StyledSectionSubTitle>
        </Headline>
        <Questions />
      </SectionLayout>
    </Section>
  );
};
